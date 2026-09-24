# Development usage

Available in the inherited source: local window/idle collectors, a bucket/event API
and a web interface for activity history.
<!-- capability:local-capture:Available -->
<!-- capability:local-api:Available -->
<!-- capability:web-interface:Available -->

The normal local server uses port 5600; testing configurations use port 5666.
Open the locally running web interface only after confirming which configuration
and database the server uses. The collectors require OS permissions and a supported
display session; a headless build does not prove capture works on a real desktop.

Use a separate OS account and synthetic activity for experiments. Existing
ActivityWatch configuration and data paths may be reused by upstream components.
Stop collector processes to stop capture in the baseline. A unified product pause
control, permission panel and data-retention experience remain product work.

Inspect exports before sharing them: application names, window titles, URLs and
other event fields can be sensitive. Preserve a backup before any import, deletion
or database migration. There is no supported recovery workflow in this bootstrap.
