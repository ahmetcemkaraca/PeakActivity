import json
import logging
import traceback
from functools import wraps
from threading import Lock
from typing import Dict

import iso8601
import requests
import yaml
from aw_core import schema
from aw_core.models import Event
from aw_core.exceptions import AWNetworkException, AWValidationException, AWFirebaseException
from aw_query.exceptions import QueryException
from flask import Blueprint, current_app, jsonify, make_response, request
from flask_restx import Api, Resource, fields

from . import logger
from .api import ServerAPI
from .exceptions import BadRequest, Unauthorized
from praisonai_integration.agent_service import AgentsGenerator


def host_header_check(f):
    """
    Protects against DNS rebinding attacks (see https://github.com/ActivityWatch/activitywatch/security/advisories/GHSA-v9fg-6g9j-h4x4)

    Some discussion in Syncthing how they do it: https://github.com/syncthing/syncthing/issues/4819
    """

    @wraps(f)
    def decorator(*args, **kwargs):
        server_host = current_app.config["HOST"]
        req_host = request.headers.get("host", None)
        if server_host == "0.0.0.0":
            logger.warning(
                "Server is listening on 0.0.0.0, host header check is disabled (potential security issue)."
            )
        elif req_host is None:
            return {"message": "host header is missing"}, 400
        else:
            if req_host.split(":")[0] not in ["localhost", "127.0.0.1", server_host]:
                return {"message": f"host header is invalid (was {req_host})"}, 400
        return f(*args, **kwargs)

    return decorator


# Flask Blueprint for API routes with /api prefix
blueprint = Blueprint("api", __name__, url_prefix="/api")

# Flask-RESTX API object with Swagger documentation at root and DNS rebinding protection
api = Api(blueprint, doc="/", decorators=[host_header_check])


# Schema models loaded from JSONSchema definitions in aw_core
# These define the structure for API request/response validation and documentation
event = api.schema_model("Event", schema.get_json_schema("event"))
bucket = api.schema_model("Bucket", schema.get_json_schema("bucket"))
buckets_export = api.schema_model("Export", schema.get_json_schema("export"))

# TODO: Construct all the models from JSONSchema?
#       A downside to contructing from JSONSchema: flask-restplus does not have marshalling support

# Server information model for /info endpoint
# Contains basic server metadata including hostname, version, and testing mode
info = api.model(
    "Info",
    {
        "hostname": fields.String(),
        "version": fields.String(),
        "testing": fields.Boolean(),
        "device_id": fields.String(),
    },
)

# Request model for bucket creation endpoint
# Defines required fields for creating new data buckets
create_bucket = api.model(
    "CreateBucket",
    {
        "client": fields.String(required=True),
        "type": fields.String(required=True),
        "hostname": fields.String(required=True),
    },
)

# Request model for bucket update endpoint
# All fields are optional for partial updates
update_bucket = api.model(
    "UpdateBucket",
    {
        "client": fields.String(required=False),
        "type": fields.String(required=False),
        "hostname": fields.String(required=False),
        "data": fields.String(required=False),
    },
)

# Query request model for ActivityWatch query language
# Defines structure for time-based data queries with custom query strings
query = api.model(
    "Query",
    {
        "timeperiods": fields.List(
            fields.String, required=True, description="List of periods to query"
        ),
        "query": fields.List(
            fields.String, required=True, description="String list of query statements"
        ),
    },
)


def copy_doc(api_method):
    """Decorator that copies another functions docstring to the decorated function.
    Used to copy the docstrings in ServerAPI over to the flask-restplus Resources.
    (The copied docstrings are then used by flask-restplus/swagger)"""

    def decorator(f):
        f.__doc__ = api_method.__doc__
        return f

    return decorator


# SERVER INFO


@api.route("/0/info")
class InfoResource(Resource):
    @api.marshal_with(info)
    @copy_doc(ServerAPI.get_info)
    def get(self) -> Dict[str, Dict]:
        return current_app.api.get_info()


# BUCKETS


@api.route("/0/buckets/")
class BucketsResource(Resource):
    # TODO: Add response marshalling/validation
    @copy_doc(ServerAPI.get_buckets)
    def get(self) -> Dict[str, Dict]:
        return current_app.api.get_buckets()


@api.route("/0/buckets/<string:bucket_id>")
class BucketResource(Resource):
    @api.doc(model=bucket)
    @copy_doc(ServerAPI.get_bucket_metadata)
    def get(self, bucket_id):
        return current_app.api.get_bucket_metadata(bucket_id)

    @api.expect(create_bucket)
    @copy_doc(ServerAPI.create_bucket)
    def post(self, bucket_id):
        data = request.get_json()
        bucket_created = current_app.api.create_bucket(
            bucket_id,
            event_type=data["type"],
            client=data["client"],
            hostname=data["hostname"],
        )
        if bucket_created:
            return {}, 200
        else:
            return {}, 304

    @api.expect(update_bucket)
    @copy_doc(ServerAPI.update_bucket)
    def put(self, bucket_id):
        data = request.get_json()
        current_app.api.update_bucket(
            bucket_id,
            event_type=data["type"],
            client=data["client"],
            hostname=data["hostname"],
            data=data["data"],
        )
        return {}, 200

    @copy_doc(ServerAPI.delete_bucket)
    @api.param("force", "Needs to be =1 to delete a bucket it non-testing mode")
    def delete(self, bucket_id):
        args = request.args
        if not current_app.api.testing:
            if "force" not in args or args["force"] != "1":
                msg = "Deleting buckets is only permitted if aw-server is running in testing mode or if ?force=1"
                raise Unauthorized("DeleteBucketUnauthorized", msg)

        current_app.api.delete_bucket(bucket_id)
        return {}, 200


# EVENTS


@api.route("/0/buckets/<string:bucket_id>/events")
class EventsResource(Resource):
    # For some reason this doesn't work with the JSONSchema variant
    # Marshalling doesn't work with JSONSchema events
    # @api.marshal_list_with(event)
    @api.doc(model=event)
    @api.param("limit", "the maximum number of requests to get")
    @api.param("start", "Start date of events")
    @api.param("end", "End date of events")
    @copy_doc(ServerAPI.get_events)
    def get(self, bucket_id):
        args = request.args
        limit = int(args["limit"]) if "limit" in args else 500
        start = iso8601.parse_date(args["start"]) if "start" in args else None
        end = iso8601.parse_date(args["end"]) if "end" in args else None

        # API katmanındaki üst limiti burada da zorunlu kıl
        if limit > 5000:
            limit = 5000

        events = current_app.api.get_events(
            bucket_id, limit=limit, start=start, end=end
        )
        return events, 200

    # TODO: How to tell expect that it could be a list of events? Until then we can't use validate.
    @api.expect(event)
    @copy_doc(ServerAPI.create_events)
    def post(self, bucket_id):
        data = request.get_json()
        logger.debug(
            "Received post request for event in bucket '{}' and data: {}".format(
                bucket_id, data
            )
        )

        if isinstance(data, dict):
            events = [Event(**data)]
        elif isinstance(data, list):
            events = [Event(**e) for e in data]
        else:
            raise BadRequest("Invalid POST data", "")

        event = current_app.api.create_events(bucket_id, events)
        return event.to_json_dict() if event else None, 200


@api.route("/0/buckets/<string:bucket_id>/events/raw")
class EventsRawResource(Resource):
    @api.expect(event)
    @copy_doc(ServerAPI.create_raw_events)
    def post(self, bucket_id):
        data = request.get_json()
        logger.debug(
            "Received POST request for raw events in bucket '{}' and data: {}".format(
                bucket_id, data
            )
        )

        if isinstance(data, dict):
            events_data = [data]
        elif isinstance(data, list):
            events_data = data
        else:
            raise BadRequest("Invalid POST data", "Expected a dictionary or a list of dictionaries.")

        validated_events = []
        for event_data in events_data:
            try:
                # Attempt to create an Event object to validate its structure
                # This leverages the validation logic within aw_core.models.Event
                event_obj = Event(**event_data)
                validated_events.append(event_obj)
            except Exception as e:
                raise BadRequest(f"Invalid event data format: {e}", str(e)) from e

        event = current_app.api.create_raw_events(bucket_id, validated_events)
        return event.to_json_dict() if event else None, 200


@api.route("/0/buckets/<string:bucket_id>/events/encrypted-ai")
class EventsEncryptedAIResource(Resource):
    @api.expect(event) # TODO: Define a proper model for encrypted events
    @copy_doc(ServerAPI.create_encrypted_ai_events)
    def post(self, bucket_id):
        data = request.get_json()
        logger.debug(
            "Received POST request for encrypted AI events in bucket '{}' and data: {}".format(
                bucket_id, data
            )
        )

        if isinstance(data, dict):
            encrypted_events_data = [data]
        elif isinstance(data, list):
            encrypted_events_data = data
        else:
            raise BadRequest("Invalid POST data", "Expected a dictionary or a list of dictionaries for encrypted events.")

        # TODO: Add more robust validation for encrypted data structure (payload, metadata)
        
        event = current_app.api.create_encrypted_ai_events(bucket_id, encrypted_events_data)
        return event.to_json_dict() if event else None, 200


@api.route("/0/buckets/<string:bucket_id>/events/encrypted-noai")
class EventsEncryptedNoAIResource(Resource):
    @api.expect(event) # TODO: Define a proper model for encrypted events
    @copy_doc(ServerAPI.create_encrypted_noai_events)
    def post(self, bucket_id):
        data = request.get_json()
        logger.debug(
            "Received POST request for encrypted non-AI events in bucket '{}' and data: {}".format(
                bucket_id, data
            )
        )

        if isinstance(data, dict):
            encrypted_events_data = [data]
        elif isinstance(data, list):
            encrypted_events_data = data
        else:
            raise BadRequest("Invalid POST data", "Expected a dictionary or a list of dictionaries for encrypted events.")

        # TODO: Add more robust validation for encrypted data structure (payload, metadata)
        
        event = current_app.api.create_encrypted_noai_events(bucket_id, encrypted_events_data)
        return event.to_json_dict() if event else None, 200


@api.route("/0/buckets/<string:bucket_id>/events/count")
class EventCountResource(Resource):
    @api.doc(model=fields.Integer)
    @api.param("start", "Start date of eventcount")
    @api.param("end", "End date of eventcount")
    @copy_doc(ServerAPI.get_eventcount)
    def get(self, bucket_id):
        args = request.args
        start = iso8601.parse_date(args["start"]) if "start" in args else None
        end = iso8601.parse_date(args["end"]) if "end" in args else None

        events = current_app.api.get_eventcount(bucket_id, start=start, end=end)
        return events, 200


@api.route("/0/buckets/<string:bucket_id>/events/<int:event_id>")
class EventResource(Resource):
    @api.doc(model=event)
    @copy_doc(ServerAPI.get_event)
    def get(self, bucket_id: str, event_id: int):
        logger.debug(
            f"Received get request for event with id '{event_id}' in bucket '{bucket_id}'"
        )
        event = current_app.api.get_event(bucket_id, event_id)
        if event:
            return event, 200
        else:
            return None, 404

    @copy_doc(ServerAPI.delete_event)
    def delete(self, bucket_id: str, event_id: int):
        logger.debug(
            "Received delete request for event with id '{}' in bucket '{}'".format(
                event_id, bucket_id
            )
        )
        success = current_app.api.delete_event(bucket_id, event_id)
        return {"success": success}, 200


@api.route("/0/buckets/<string:bucket_id>/heartbeat")
class HeartbeatResource(Resource):
    def __init__(self, *args, **kwargs):
        self.lock = Lock()
        super().__init__(*args, **kwargs)

    @api.expect(event, validate=True)
    @api.param(
        "pulsetime", "Largest timewindow allowed between heartbeats for them to merge"
    )
    @copy_doc(ServerAPI.heartbeat)
    def post(self, bucket_id):
        heartbeat = Event(**request.get_json())

        if "pulsetime" in request.args:
            pulsetime = float(request.args["pulsetime"])
        else:
            raise BadRequest("MissingParameter", "Missing required parameter pulsetime")

        # This lock is meant to ensure that only one heartbeat is processed at a time,
        # as the heartbeat function is not thread-safe.
        # This should maybe be moved into the api.py file instead (but would be very messy).
        aquired = self.lock.acquire(timeout=1)
        if not aquired:
            logger.warning(
                "Heartbeat lock could not be aquired within a reasonable time, this likely indicates a bug."
            )
        try:
            event = current_app.api.heartbeat(bucket_id, heartbeat, pulsetime)
        finally:
            self.lock.release()
        return event.to_json_dict(), 200


# QUERY


@api.route("/0/query/")
class QueryResource(Resource):
    # TODO Docs
    @api.expect(query, validate=True)
    @api.param("name", "Name of the query (required if using cache)")
    def post(self):
        name = ""
        if "name" in request.args:
            name = request.args["name"]
        query = request.get_json()
        try:
            result = current_app.api.query2(
                name, query["query"], query["timeperiods"], False
            )
            return jsonify(result)
        except QueryException as qe:
            traceback.print_exc()
            return {"type": type(qe).__name__, "message": str(qe)}, 400


# EXPORT AND IMPORT


@api.route("/0/export")
class ExportAllResource(Resource):
    @api.doc(model=buckets_export)
    @copy_doc(ServerAPI.export_all)
    def get(self):
        buckets_export = current_app.api.export_all()
        payload = {"buckets": buckets_export}
        response = make_response(json.dumps(payload))
        filename = "aw-buckets-export.json"
        response.headers["Content-Disposition"] = "attachment; filename={}".format(
            filename
        )
        return response


# TODO: Perhaps we don't need this, could be done with a query argument to /0/export instead
@api.route("/0/buckets/<string:bucket_id>/export")
class BucketExportResource(Resource):
    @api.doc(model=buckets_export)
    @copy_doc(ServerAPI.export_bucket)
    def get(self, bucket_id):
        bucket_export = current_app.api.export_bucket(bucket_id)
        payload = {"buckets": {bucket_export["id"]: bucket_export}}
        response = make_response(json.dumps(payload))
        filename = "aw-bucket-export_{}.json".format(bucket_export["id"])
        response.headers["Content-Disposition"] = "attachment; filename={}".format(
            filename
        )
        return response


@api.route("/0/import")
class ImportAllResource(Resource):
    @api.expect(buckets_export)
    @copy_doc(ServerAPI.import_all)
    def post(self):
        # If import comes from a form in th web-ui
        if len(request.files) > 0:
            # web-ui form only allows one file, but technically it's possible to
            # upload multiple files at the same time
            for filename, f in request.files.items():
                buckets = json.loads(f.stream.read())["buckets"]
                current_app.api.import_all(buckets)
        # Normal import from body
        else:
            buckets = request.get_json()["buckets"]
            current_app.api.import_all(buckets)
        return None, 200


# LOGGING


@api.route("/0/log")
class LogResource(Resource):
    @copy_doc(ServerAPI.get_log)
    def get(self):
        return current_app.api.get_log(), 200


# SETTINGS


@api.route("/0/settings", defaults={"key": ""})
@api.route("/0/settings/<string:key>")
class SettingsResource(Resource):
    def get(self, key: str):
        data = current_app.api.get_setting(key)
        return jsonify(data)

    def post(self, key: str):
        if not key:
            raise BadRequest("MissingParameter", "Missing required parameter key")
        data = current_app.api.set_setting(key, request.get_json())
        return data


@api.route("/0/manualactivity")
class ManualActivityResource(Resource):
    @api.expect(event)
    @api.param("bucket_id", "Optional bucket id to override default bucket name")
    @copy_doc(ServerAPI.log_manual_activity)
    def post(self):
        bucket_id = request.args.get("bucket_id", None)
        data = request.get_json()
        result = current_app.api.log_manual_activity(data, bucket_id)
        # Convert Event to JSON dict if single event returned
        if result is None:
            return None, 200
        elif isinstance(result, Event):
            return result.to_json_dict(), 200
        else:
            # Fallback: assume list already serialized
            return result, 200


@api.route("/0/microsurvey")
class MicroSurveyResource(Resource):
    @api.expect(event)
    @api.param("bucket_id", "Optional bucket id override")
    @copy_doc(ServerAPI.log_microsurvey)
    def post(self):
        data = request.get_json()
        event = current_app.api.log_microsurvey(
            Event(**data), bucket_id=request.args.get("bucket_id")
        )
        return event.to_json_dict() if event else None, 200

# AI Endpoints (NEW SECTION)

focus_quality_score_input = api.model(
    "FocusQualityScoreInput",
    {
        "events": fields.List(fields.Raw, required=True, description="List of activity events"),
        "user_tz": fields.String(required=True, description="User's timezone"),
    },
)

focus_quality_score_output = api.model(
    "FocusQualityScoreOutput",
    {
        "session_scores": fields.List(fields.Raw, required=True),
        "daily_average": fields.Float(allow_null=True),
        "explanations": fields.String(required=True),
    },
)

@api.route("/0/ai/focus-quality-score")
class FocusQualityScoreResource(Resource):
    @api.expect(focus_quality_score_input)
    @api.marshal_with(focus_quality_score_output)
    def post(self):
        data = request.get_json()
        events = data.get("events")
        user_tz = data.get("user_tz")

        if not events or not user_tz:
            raise BadRequest("Missing required fields", "Both 'events' and 'user_tz' are required.")

        try:
            # Firebase Fonksiyonunun URL'sini buradan çağırın
            # Fonksiyonun URL'si dağıtıldıktan sonra edinilmelidir
            firebase_function_url = "YOUR_FIREBASE_FUNCTION_URL_HERE"
            response = requests.post(firebase_function_url, json=data, timeout=30)
            response.raise_for_status()  # HTTP hataları için hata fırlat
            return response.json(), 200
        except requests.exceptions.Timeout as timeout_e:
            logger.error("Firebase Function call timed out: %s", timeout_e)
            raise BadRequest("Request Timeout", "Firebase Function call timed out") from timeout_e
        except requests.exceptions.ConnectionError as conn_e:
            logger.error("Firebase Function connection failed: %s", conn_e)
            raise BadRequest("Connection Error", "Unable to connect to Firebase Function") from conn_e
        except requests.exceptions.HTTPError as http_e:
            logger.error("Firebase Function HTTP error: %s", http_e)
            raise BadRequest("HTTP Error", f"Firebase Function returned error: {http_e}") from http_e
        except requests.exceptions.RequestException as req_e:
            logger.error("Firebase Function request failed: %s", req_e)
            raise BadRequest("Request Error", f"Firebase Function request failed: {req_e}") from req_e
        except (json.JSONDecodeError, ValueError) as json_e:
            logger.error("Firebase Function response parsing failed: %s", json_e)
            raise BadRequest("Response Format Error", "Invalid response from Firebase Function") from json_e

behavioral_trends_input = api.model(
    "BehavioralTrendsInput",
    {
        "daily_totals": fields.List(fields.Raw, required=True, description="List of daily activity totals"),
        "window": fields.Integer(required=True, description="Number of days for the analysis window"),
    },
)

behavioral_trends_output = api.model(
    "BehavioralTrendsOutput",
    {
        "trending_categories": fields.List(fields.Raw, required=True),
        "seasonality": fields.List(fields.Raw, required=True),
        "summary": fields.String(required=True),
    },
)

@api.route("/0/ai/behavioral-trends")
class BehavioralTrendsResource(Resource):
    @api.expect(behavioral_trends_input)
    @api.marshal_with(behavioral_trends_output)
    def post(self):
        data = request.get_json()
        daily_totals = data.get("daily_totals")
        window = data.get("window")

        if not daily_totals or window is None:
            raise BadRequest("Missing required fields", "Both 'daily_totals' and 'window' are required.")

        try:
            # Firebase Fonksiyonunun URL'sini buradan çağırın
            # Fonksiyonun URL'si dağıtıldıktan sonra edinilmelidir
            firebase_function_url = "YOUR_FIREBASE_BEHAVIORAL_TRENDS_FUNCTION_URL_HERE"
            response = requests.post(firebase_function_url, json=data, timeout=30)
            response.raise_for_status()  # HTTP hataları için hata fırlat
            return response.json(), 200
        except requests.exceptions.Timeout as timeout_e:
            logger.error("Behavioral trends Firebase Function call timed out: %s", timeout_e)
            raise BadRequest("Request Timeout", "Behavioral trends analysis timed out") from timeout_e
        except requests.exceptions.ConnectionError as conn_e:
            logger.error("Behavioral trends Firebase Function connection failed: %s", conn_e)
            raise BadRequest("Connection Error", "Unable to connect to behavioral trends service") from conn_e
        except requests.exceptions.HTTPError as http_e:
            logger.error("Behavioral trends Firebase Function HTTP error: %s", http_e)
            raise BadRequest("HTTP Error", f"Behavioral trends service error: {http_e}") from http_e
        except requests.exceptions.RequestException as req_e:
            logger.error("Behavioral trends Firebase Function request failed: %s", req_e)
            raise BadRequest("Request Error", f"Behavioral trends request failed: {req_e}") from req_e
        except (json.JSONDecodeError, ValueError) as json_e:
            logger.error("Behavioral trends response parsing failed: %s", json_e)
            raise BadRequest("Response Format Error", "Invalid response from behavioral trends service") from json_e

# Anomaly Detection Endpoints

anomaly_detection_input = api.model(
    "AnomalyDetectionInput",
    {
        "daily_totals": fields.List(fields.Raw, required=True, description="List of daily activity totals for anomaly detection"),
    },
)

anomaly_detection_output = api.model(
    "AnomalyDetectionOutput",
    {
        "anomalies": fields.List(fields.Raw, required=True),
        "baseline_mean": fields.Float(required=True),
        "baseline_stddev": fields.Float(required=True),
        "explanation": fields.String(required=True),
    },
)

@api.route("/0/ai/anomaly-detection")
class AnomalyDetectionResource(Resource):
    @api.expect(anomaly_detection_input)
    @api.marshal_with(anomaly_detection_output)
    def post(self):
        data = request.get_json()
        daily_totals = data.get("daily_totals")

        if not daily_totals:
            raise BadRequest("Missing required field", "'daily_totals' is required.")

        try:
            # Firebase Fonksiyonunun URL'sini buradan çağırın
            # Fonksiyonun URL'si dağıtıldıktan sonra edinilmelidir
            firebase_function_url = "YOUR_FIREBASE_ANOMALY_DETECTION_FUNCTION_URL_HERE"
            response = requests.post(firebase_function_url, json=data, timeout=30)
            response.raise_for_status()  # HTTP hataları için hata fırlat
            return response.json(), 200
        except requests.exceptions.Timeout as timeout_e:
            logger.error("Anomaly detection Firebase Function call timed out: %s", timeout_e)
            raise BadRequest("Request Timeout", "Anomaly detection analysis timed out") from timeout_e
        except requests.exceptions.ConnectionError as conn_e:
            logger.error("Anomaly detection Firebase Function connection failed: %s", conn_e)
            raise BadRequest("Connection Error", "Unable to connect to anomaly detection service") from conn_e
        except requests.exceptions.HTTPError as http_e:
            logger.error("Anomaly detection Firebase Function HTTP error: %s", http_e)
            raise BadRequest("HTTP Error", f"Anomaly detection service error: {http_e}") from http_e
        except requests.exceptions.RequestException as req_e:
            logger.error("Anomaly detection Firebase Function request failed: %s", req_e)
            raise BadRequest("Request Error", f"Anomaly detection request failed: {req_e}") from req_e
        except (json.JSONDecodeError, ValueError) as json_e:
            logger.error("Anomaly detection response parsing failed: %s", json_e)
            raise BadRequest("Response Format Error", "Invalid response from anomaly detection service") from json_e

# Automatic Categorization / Labeling Endpoints

auto_categorization_input = api.model(
    "AutoCategorizationInput",
    {
        "events": fields.List(fields.Raw, required=True, description="List of events to categorize"),
    },
)

auto_categorization_output = api.model(
    "AutoCategorizationOutput",
    {
        "labels": fields.List(fields.Raw, required=True),
    },
)

@api.route("/0/ai/auto-categorization")
class AutoCategorizationResource(Resource):
    @api.expect(auto_categorization_input)
    @api.marshal_with(auto_categorization_output)
    def post(self):
        data = request.get_json()
        events = data.get("events")

        if not events:
            raise BadRequest("Missing required field", "'events' is required.")

        try:
            # Firebase Fonksiyonunun URL'sini buradan çağırın
            # Fonksiyonun URL'si dağıtıldıktan sonra edinilmelidir
            firebase_function_url = "YOUR_FIREBASE_AUTO_CATEGORIZATION_FUNCTION_URL_HERE"
            response = requests.post(firebase_function_url, json=data)
            response.raise_for_status()  # HTTP hataları için hata fırlat
            return response.json(), 200
        except requests.exceptions.RequestException as e:
            logger.error(f"Firebase Function call failed: {e}")
            raise BadRequest("Firebase Function Error", str(e))
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            raise BadRequest("Internal Server Error", str(e))

# Community-Based Rule Sets Endpoints

community_rules_input = api.model(
    "CommunityRulesInput",
    {
        "event": fields.Raw(required=True, description="The event to categorize"),
        "community_rules": fields.List(fields.Raw, required=True, description="List of community rules"),
    },
)

community_rules_output = api.model(
    "CommunityRulesOutput",
    {
        "matched_rule": fields.Raw(allow_null=True),
        "category": fields.String(allow_null=True),
        "source": fields.String(required=True),
    },
)

@api.route("/0/ai/community-rules")
class CommunityRulesResource(Resource):
    @api.expect(community_rules_input)
    @api.marshal_with(community_rules_output)
    def post(self):
        data = request.get_json()
        event = data.get("event")
        community_rules = data.get("community_rules")

        if not event or not community_rules:
            raise BadRequest("Missing required fields", "'event' and 'community_rules' are required.")

        try:
            # Firebase Fonksiyonunun URL'sini buradan çağırın
            # Fonksiyonun URL'si dağıtıldıktan sonra edinilmelidir
            firebase_function_url = "YOUR_FIREBASE_COMMUNITY_RULES_FUNCTION_URL_HERE"
            response = requests.post(firebase_function_url, json=data)
            response.raise_for_status()  # HTTP hataları için hata fırlat
            return response.json(), 200
        except requests.exceptions.RequestException as e:
            logger.error(f"Firebase Function call failed: {e}")
            raise BadRequest("Firebase Function Error", str(e))
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            raise BadRequest("Internal Server Error", str(e))

# Contextual Categorization Endpoints

contextual_categorization_input = api.model(
    "ContextualCategorizationInput",
    {
        "context": fields.String(required=True, description="Text context for categorization"),
        "language": fields.String(required=False, description="Language of the context (e.g., 'en', 'tr')"),
    },
)

contextual_categorization_output = api.model(
    "ContextualCategorizationOutput",
    {
        "category": fields.String(required=True),
        "confidence": fields.Float(required=True),
        "rationale": fields.String(required=True),
    },
)

@api.route("/0/ai/contextual-categorization")
class ContextualCategorizationResource(Resource):
    @api.expect(contextual_categorization_input)
    @api.marshal_with(contextual_categorization_output)
    def post(self):
        data = request.get_json()
        context = data.get("context")
        language = data.get("language")

        if not context:
            raise BadRequest("Missing required field", "'context' is required.")

        try:
            # Firebase Fonksiyonunun URL'sini buradan çağırın
            # Fonksiyonun URL'si dağıtıldıktan sonra edinilmelidir
            firebase_function_url = "YOUR_FIREBASE_CONTEXTUAL_CATEGORIZATION_FUNCTION_URL_HERE"
            payload = {"context": context}
            if language:
                payload["language"] = language
            
            response = requests.post(firebase_function_url, json=payload)
            response.raise_for_status()  # HTTP hataları için hata fırlat
            return response.json(), 200
        except requests.exceptions.RequestException as e:
            logger.error(f"Firebase Function call failed: {e}")
            raise BadRequest("Firebase Function Error", str(e))
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            raise BadRequest("Internal Server Error", str(e))

# AGENT GENERATION
agent_generation_request = api.model(
    "AgentGenerationRequest",
    {
        "agent_config_data": fields.String(
            required=True, description="YAML string of agent and task configurations"
        ),
        "topic": fields.String(
            required=True, description="The topic or goal for the agents"
        ),
    },
)

@api.route("/0/agents/generate")
class AgentGenerationResource(Resource):
    @api.expect(agent_generation_request)
    def post(self):
        data = request.get_json()
        agent_config_data_str = data.get("agent_config_data")
        topic = data.get("topic")
        gemini_api_key = request.headers.get("X-Gemini-Api-Key")

        if not gemini_api_key:
            raise BadRequest("Missing API Key", "X-Gemini-Api-Key header is required.")

        try:
            agent_config_data = yaml.safe_load(agent_config_data_str)
        except yaml.YAMLError as e:
            raise BadRequest("Invalid YAML", f"Could not parse agent_config_data: {e}")

        try:
            # AgentsGenerator örneğini oluştur ve ajanları çalıştır
            generator = AgentsGenerator(agent_config_data=agent_config_data, api_key=gemini_api_key)
            result = generator.generate_and_run_agents(topic=topic)
            return {"message": "Agent generation and execution started successfully", "result": result}, 200
        except Exception as e:
            logger.exception(f"Error during agent generation and execution: {e}")
            raise BadRequest("Agent Generation Error", str(e))
