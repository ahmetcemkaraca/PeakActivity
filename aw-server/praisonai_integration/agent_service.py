import os
import logging
import yaml
import importlib
import importlib.util
import inspect
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable

# Langchain import for Google Generative AI
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    GOOGLE_GENAI_AVAILABLE = True
except ImportError:
    GOOGLE_GENAI_AVAILABLE = False
    logging.warning("langchain-google-genai not found. Please install with 'pip install langchain-google-genai'")

# PraisonAI Agents import
try:
    from praisonaiagents import Agent as PraisonAgent, Task as PraisonTask, PraisonAIAgents
    PRAISONAI_AVAILABLE = True
except ImportError:
    PRAISONAI_AVAILABLE = False
    logging.warning("praisonaiagents not found. Please install with 'pip install praisonaiagents'")

# Import custom tools
try:
    from .tools import (
        query_activity_data,
        get_user_buckets,
        get_focus_score,
        get_productivity_metrics,
        read_user_data,
        write_user_data,
        update_user_goals,
        create_automation_rule,
        send_notification,
        send_ai_recommendation,
        schedule_reminder,
        generate_productivity_report,
        analyze_behavior_patterns,
        detect_anomalies,
        predict_task_completion
    )
    CUSTOM_TOOLS_AVAILABLE = True
except ImportError as e:
    CUSTOM_TOOLS_AVAILABLE = False
    logging.warning(f"Custom tools not available: {e}")

logger = logging.getLogger(__name__)
logging.basicConfig(level=os.environ.get('LOGLEVEL', 'INFO').upper(), format='%(asctime)s - %(levelname)s - %(message)s')

class PraisonAIModel:
    def __init__(self, model_name: str = "gemini-1.5-flash-8b", api_key: str = None):
        """
        Initializes the PraisonAIModel specifically for Gemini 2.5 Flash.

        Args:
            model_name (str): The name of the Gemini model. Defaults to "gemini-1.5-flash-8b".
            api_key (str): The Google API key. This is expected to be provided securely (e.g., from Firebase Functions).
        """
        self.model_name = model_name
        self.api_key = api_key

        if not GOOGLE_GENAI_AVAILABLE:
            raise ImportError(
                "Required Langchain Integration 'langchain-google-genai' not found. "
                "Please install with 'pip install langchain-google-genai'"
            )
        if not self.api_key:
            raise ValueError("API Key for Google Generative AI is required.")

    def get_model(self):
        """
        Returns an instance of the langchain ChatGoogleGenerativeAI client.
        """
        return ChatGoogleGenerativeAI(
            model=self.model_name,
            google_api_key=self.api_key
        )

class AgentsGenerator:
    def __init__(self, agent_config_data: dict, api_key: str, log_level=None):
        """
        Initializes the AgentsGenerator object for PraisonAI framework.

        Parameters:
            agent_config_data (dict): Dictionary containing agent and task configurations.
            api_key (str): The Google API key to be passed to the PraisonAIModel.
            log_level (int, optional): The logging level to use. Defaults to logging.INFO.
        """
        self.agent_config_data = agent_config_data
        self.api_key = api_key
        self.log_level = log_level or logging.getLogger().getEffectiveLevel()
        if self.log_level == logging.NOTSET:
            self.log_level = os.environ.get('LOGLEVEL', 'INFO').upper()

        logging.basicConfig(level=self.log_level, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(self.log_level)

        if not PRAISONAI_AVAILABLE:
            raise ImportError("PraisonAI is not installed. Please install it with 'pip install praisonaiagents'")

    def _is_function_or_decorated(self, obj):
        return inspect.isfunction(obj) or hasattr(obj, '__call__')

    def get_builtin_tools(self) -> Dict[str, Callable]:
        """
        Returns a dictionary of built-in custom tools for PeakActivity agents.
        """
        if not CUSTOM_TOOLS_AVAILABLE:
            self.logger.warning("Custom tools are not available. Agents will have limited capabilities.")
            return {}

        return {
            # ActivityWatch tools
            "query_activity_data": query_activity_data,
            "get_user_buckets": get_user_buckets,
            "get_focus_score": get_focus_score,
            "get_productivity_metrics": get_productivity_metrics,

            # Firestore tools
            "read_user_data": read_user_data,
            "write_user_data": write_user_data,
            "update_user_goals": update_user_goals,
            "create_automation_rule": create_automation_rule,

            # Notification tools
            "send_notification": send_notification,
            "send_ai_recommendation": send_ai_recommendation,
            "schedule_reminder": schedule_reminder,

            # Analytics tools
            "generate_productivity_report": generate_productivity_report,
            "analyze_behavior_patterns": analyze_behavior_patterns,
            "detect_anomalies": detect_anomalies,
            "predict_task_completion": predict_task_completion
        }

    def load_tools(self, tools_config: list, user_id: Optional[str] = None):
        """
        Loads tools based on the provided configuration.
        Now supports built-in PeakActivity tools and custom file-based tools.

        Args:
            tools_config: List of tool configurations
            user_id: User ID for context-aware tools
        """
        loaded_tools = []
        builtin_tools = self.get_builtin_tools()

        for tool_entry in tools_config:
            if isinstance(tool_entry, str):
                # Simple string format: just tool name
                tool_name = tool_entry
                tool_path = None
            elif isinstance(tool_entry, dict):
                # Dictionary format with name and optional path
                tool_name = tool_entry.get('name')
                tool_path = tool_entry.get('path')
            else:
                self.logger.warning(f"Invalid tool configuration: {tool_entry}")
                continue

            # First, check if it's a built-in tool
            if tool_name in builtin_tools:
                tool_func = builtin_tools[tool_name]

                # If user_id is provided, create a partial function with user_id pre-filled
                if user_id and 'user_id' in inspect.signature(tool_func).parameters:
                    from functools import partial
                    tool_func = partial(tool_func, user_id=user_id)

                loaded_tools.append(tool_func)
                self.logger.info(f"Loaded built-in tool: {tool_name}")
                continue

            # If not built-in and has a path, try to load from file
            if tool_path:
                try:
                    spec = importlib.util.spec_from_file_location("custom_tool_module", tool_path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    for name, obj in inspect.getmembers(module, self._is_function_or_decorated):
                        if name == tool_name:
                            loaded_tools.append(obj)
                            self.logger.info(f"Loaded custom tool '{tool_name}' from '{tool_path}'")
                            break
                except Exception as e:
                    self.logger.warning(f"Error loading tool '{tool_name}' from '{tool_path}': {e}")
            else:
                self.logger.warning(f"Tool '{tool_name}' not found in built-in tools and no path provided")

        return loaded_tools

    def generate_and_run_agents(self, topic: str, user_id: Optional[str] = None):
        """
        Generates and runs agents and tasks using the PraisonAI framework.

        Parameters:
            topic (str): The topic or goal for the agents.
            user_id (str, optional): User ID for context-aware tool execution.
        """
        agents_data = self.agent_config_data.get("agents", [])
        tasks_data = self.agent_config_data.get("tasks", [])

        praison_agents = []
        for agent_config in agents_data:
            model = PraisonAIModel(model_name="gemini-1.5-flash-8b", api_key=self.api_key).get_model()

            # Load tools with user_id context
            agent_tools = self.load_tools(agent_config.get("tools", []), user_id=user_id)

            praison_agent = PraisonAgent(
                llm=model,
                name=agent_config.get("name"),
                role=agent_config.get("role"),
                goal=agent_config.get("goal"),
                backstory=agent_config.get("backstory"),
                tools=agent_tools,
                verbose=True,
                # Other potential parameters from agent_config if needed
            )
            praison_agents.append(praison_agent)
            self.logger.info(f"PraisonAI Agent '{praison_agent.name}' created with {len(agent_tools)} tools.")

        praison_tasks = []
        for task_config in tasks_data:
            task_agent = next((a for a in praison_agents if a.name == task_config.get("agent")), None)
            if not task_agent:
                self.logger.error(f"Agent '{task_config.get('agent')}' not found for task '{task_config.get('name')}'")
                continue

            praison_task = PraisonTask(
                agent=task_agent,
                description=task_config.get("description"),
                expected_output=task_config.get("expected_output"),
                # Other potential parameters from task_config if needed
            )
            praison_tasks.append(praison_task)
            self.logger.info(f"PraisonAI Task created for agent '{task_agent.name}'.")

        if not praison_agents or not praison_tasks:
            self.logger.error("No PraisonAI agents or tasks were successfully created. Aborting execution.")
            return {
                "success": False,
                "error": "No agents or tasks created",
                "agents_count": len(praison_agents),
                "tasks_count": len(praison_tasks)
            }

        try:
            praison_ai_agents_instance = PraisonAIAgents(
                agents=praison_agents,
                tasks=praison_tasks,
                process="sequential" # Or "hierarchical", depending on your needs
            )

            self.logger.info(f"Starting PraisonAI Agents process for topic: {topic}")
            result = praison_ai_agents_instance.kickoff()
            self.logger.info(f"PraisonAI Agents process finished. Result: {result}")

            return {
                "success": True,
                "topic": topic,
                "user_id": user_id,
                "agents_count": len(praison_agents),
                "tasks_count": len(praison_tasks),
                "result": str(result)
            }
        except Exception as e:
            self.logger.error(f"Error during PraisonAI Agents kickoff: {e}")
            return {
                "success": False,
                "error": str(e),
                "topic": topic,
                "user_id": user_id
            } 