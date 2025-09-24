"""PraisonAI Agent Integration Service for ActivityWatch.

This module provides integration between ActivityWatch and PraisonAI Agents framework,
enabling AI-powered analysis and automation of activity data. It supports Google's
Gemini models through LangChain integration for advanced natural language processing.

Key Features:
- Google Gemini model integration via LangChain
- PraisonAI Agents framework support for multi-agent workflows
- Dynamic tool loading for agent capabilities
- Configurable agent and task creation from YAML/dict configurations
- Sequential and hierarchical agent process execution

Dependencies:
- langchain-google-genai: For Google Gemini model access
- praisonaiagents: For multi-agent AI framework
- Standard Python libraries for configuration management

Usage:
    model = PraisonAIModel(api_key="your_api_key")
    generator = AgentsGenerator(config_data, api_key)
    result = generator.generate_and_run_agents("analyze user productivity")
"""

import os
import logging
import yaml
import importlib
import importlib.util
import inspect
from pathlib import Path

# Langchain import for Google Generative AI
try:
    from langchain_google_genai import ChatGoogleGenerativeAI

    GOOGLE_GENAI_AVAILABLE = True
except ImportError:
    GOOGLE_GENAI_AVAILABLE = False
    logging.warning(
        "langchain-google-genai not found. Please install with 'pip install langchain-google-genai'"
    )

# PraisonAI Agents import
try:
    from praisonaiagents import (
        Agent as PraisonAgent,
        Task as PraisonTask,
        PraisonAIAgents,
    )

    PRAISONAI_AVAILABLE = True
except ImportError:
    PRAISONAI_AVAILABLE = False
    logging.warning(
        "praisonaiagents not found. Please install with 'pip install praisonaiagents'"
    )

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=os.environ.get("LOGLEVEL", "INFO").upper(),
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class PraisonAIModel:
    """Wrapper for Google Gemini model integration with PraisonAI.

    Provides a standardized interface for creating and configuring Google Gemini
    models through LangChain for use with PraisonAI Agents framework.

    Supported Models:
        - gemini-1.5-flash-8b: Fast, efficient model for general tasks
        - gemini-pro: More capable model for complex reasoning
        - Other Gemini variants supported by LangChain
    """

    def __init__(self, model_name: str = "gemini-1.5-flash-8b", api_key: str = None):
        """Initialize the PraisonAIModel for Google Gemini integration.

        Args:
            model_name: The name of the Gemini model. Defaults to "gemini-1.5-flash-8b"
                       for optimal speed/performance balance. Other options include
                       "gemini-pro" for more complex tasks.
            api_key: The Google API key for authentication. Must be provided securely
                    (e.g., from Firebase Functions environment variables).

        Raises:
            ImportError: If langchain-google-genai is not installed
            ValueError: If api_key is not provided

        Note:
            API keys should never be hardcoded. Use environment variables or
            secure configuration management systems.
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
        """Create and return a LangChain ChatGoogleGenerativeAI instance.

        Returns:
            ChatGoogleGenerativeAI: Configured Gemini model instance ready for
                                   use with PraisonAI Agents or direct LangChain operations

        Note:
            The returned model can be used directly with PraisonAI Agent constructors
            or for standalone LangChain operations.
        """
        return ChatGoogleGenerativeAI(
            model=self.model_name, google_api_key=self.api_key
        )


class AgentsGenerator:
    """Generator and orchestrator for PraisonAI multi-agent workflows.

    Manages the creation, configuration, and execution of PraisonAI Agents based
    on YAML or dictionary configurations. Handles dynamic tool loading, agent
    instantiation, task assignment, and workflow execution.

    Workflow Process:
        1. Parse agent and task configurations
        2. Load custom tools from specified paths
        3. Create PraisonAI Agent instances with Gemini models
        4. Create PraisonAI Task instances and assign to agents
        5. Execute multi-agent workflow (sequential or hierarchical)

    Configuration Structure:
        {
            "agents": [
                {
                    "name": "analyst",
                    "role": "Data Analyst",
                    "goal": "Analyze user activity patterns",
                    "backstory": "Expert in productivity analysis",
                    "tools": [{"name": "tool_name", "path": "/path/to/tool.py"}]
                }
            ],
            "tasks": [
                {
                    "name": "analysis_task",
                    "agent": "analyst",
                    "description": "Analyze weekly productivity trends",
                    "expected_output": "Detailed productivity report"
                }
            ]
        }
    """

    def __init__(self, agent_config_data: dict, api_key: str, log_level=None):
        """Initialize the AgentsGenerator for PraisonAI framework.

        Args:
            agent_config_data: Dictionary containing agent and task configurations.
                              Must include 'agents' and 'tasks' keys with respective
                              configuration lists.
            api_key: The Google API key for Gemini model authentication.
                    Should be sourced from secure environment variables.
            log_level: Optional logging level override. If not provided, uses
                      environment LOGLEVEL or defaults to INFO.

        Raises:
            ImportError: If PraisonAI Agents framework is not installed

        Note:
            Logging is configured to include timestamps and level information
            for debugging multi-agent workflows.
        """
        self.agent_config_data = agent_config_data
        self.api_key = api_key
        self.log_level = log_level or logging.getLogger().getEffectiveLevel()
        if self.log_level == logging.NOTSET:
            self.log_level = os.environ.get("LOGLEVEL", "INFO").upper()

        logging.basicConfig(
            level=self.log_level, format="%(asctime)s - %(levelname)s - %(message)s"
        )
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(self.log_level)

        if not PRAISONAI_AVAILABLE:
            raise ImportError(
                "PraisonAI is not installed. Please install it with 'pip install praisonaiagents'"
            )

    def _is_function_or_decorated(self, obj):
        """Check if an object is a function or callable (including decorated functions).

        Args:
            obj: Object to check for callable nature

        Returns:
            bool: True if object is a function or has __call__ method

        Note:
            Used during dynamic tool loading to identify valid tool functions
            within loaded modules.
        """
        return inspect.isfunction(obj) or hasattr(obj, "__call__")

    def load_tools(self, tools_config: list):
        """Load tools based on the provided configuration.

        Args:
            tools_config: List of tool configuration dictionaries. Each should contain:
                         - name: Tool function name to load
                         - path: Optional file path to Python module containing the tool

        Returns:
            list: List of loaded tool functions/objects ready for agent use

        Tool Loading Process:
            1. For tools with 'path': Dynamically import the module and extract
               the named function
            2. For tools without 'path': Assumes built-in tool handled by PraisonAI
            3. Logs warnings for failed tool loads but continues processing

        Example Configuration:
            [
                {"name": "web_scraper", "path": "/tools/web_scraper.py"},
                {"name": "calendar_reader", "path": "/tools/calendar.py"},
                {"name": "built_in_tool"}  # No path for built-in tools
            ]

        Note:
            This simplified version expects tools to be directly importable
            or within a specified file path. For production use, consider
            adding tool validation and security checks.
        """
        loaded_tools = []
        for tool_entry in tools_config:
            tool_name = tool_entry.get("name")
            tool_path = tool_entry.get(
                "path"
            )  # Assuming a path to a module/file if not a standard tool

            if tool_path:
                try:
                    # Attempt to load from a specific file path
                    spec = importlib.util.spec_from_file_location(
                        "custom_tool_module", tool_path
                    )
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    for name, obj in inspect.getmembers(
                        module, self._is_function_or_decorated
                    ):
                        if name == tool_name:
                            loaded_tools.append(obj)
                            break
                except Exception as e:
                    self.logger.warning(
                        f"Error loading tool '{tool_name}' from '{tool_path}': {e}"
                    )
            else:
                # Assume it's an inbuilt tool from praisonai_tools or similar structure
                # For this simplified integration, we'll assume tools are handled by PraisonAIAgents internally
                # Or, if we need specific tools, they should be explicitly passed
                self.logger.info(
                    f"Tool '{tool_name}' configured without a path. Assuming it's an inbuilt tool or will be handled by the agent framework."
                )
                # In a full implementation, you'd dynamically import praisonai_tools or other tool modules
                # For now, we rely on praisonaiagents to handle tool instantiation if needed.
        return loaded_tools

    def generate_and_run_agents(self, topic: str):
        """Generate and execute a multi-agent workflow using PraisonAI framework.

        Args:
            topic: The topic or goal description for the agent workflow.
                  This provides context for what the agents should accomplish.

        Returns:
            The result from the PraisonAI workflow execution, typically containing
            outputs from all completed tasks.

        Workflow Steps:
            1. Parse agent configurations and create PraisonAgent instances
            2. Load custom tools for each agent based on configuration
            3. Parse task configurations and create PraisonTask instances
            4. Assign tasks to appropriate agents
            5. Create PraisonAIAgents orchestrator with sequential processing
            6. Execute the complete workflow via kickoff()

        Error Handling:
            - Logs warnings for missing agents referenced in tasks
            - Aborts execution if no valid agents or tasks are created
            - Raises exceptions from PraisonAI framework for debugging

        Model Configuration:
            Uses "gemini-pro" model for enhanced reasoning capabilities.
            Consider using "gemini-1.5-flash-8b" for faster, simpler tasks.

        Note:
            Currently uses sequential processing. For more complex workflows,
            consider "hierarchical" process mode with manager agents.
        """
        agents_data = self.agent_config_data.get("agents", [])
        tasks_data = self.agent_config_data.get("tasks", [])

        praison_agents = []
        for agent_config in agents_data:
            model = PraisonAIModel(
                model_name="gemini-pro", api_key=self.api_key
            ).get_model()
            # Assuming 'tools' can be a list of tool functions or classes
            agent_tools = self.load_tools(agent_config.get("tools", []))

            praison_agent = PraisonAgent(
                llm=model,
                name=agent_config.get("name"),
                role=agent_config.get("role"),
                goal=agent_config.get("goal"),
                backstory=agent_config.get("backstory"),
                tools=agent_tools,
                # Other potential parameters from agent_config if needed
            )
            praison_agents.append(praison_agent)
            self.logger.info(f"PraisonAI Agent '{praison_agent.name}' created.")

        praison_tasks = []
        for task_config in tasks_data:
            task_agent = next(
                (a for a in praison_agents if a.name == task_config.get("agent")), None
            )
            if not task_agent:
                self.logger.error(
                    f"Agent '{task_config.get('agent')}' not found for task '{task_config.get('name')}'"
                )
                continue

            praison_task = PraisonTask(
                agent=task_agent,
                description=task_config.get("description"),
                expected_output=task_config.get("expected_output"),
                # Other potential parameters from task_config if needed
            )
            praison_tasks.append(praison_task)
            self.logger.info(f"PraisonAI Task '{praison_task.name}' created.")

        if not praison_agents or not praison_tasks:
            self.logger.error(
                "No PraisonAI agents or tasks were successfully created. Aborting execution."
            )
            return

        try:
            praison_ai_agents_instance = PraisonAIAgents(
                agents=praison_agents,
                tasks=praison_tasks,
                process="sequential",  # Or "hierarchical", depending on your needs
            )

            self.logger.info(f"Starting PraisonAI Agents process for topic: {topic}")
            result = praison_ai_agents_instance.kickoff()
            self.logger.info(f"PraisonAI Agents process finished. Result: {result}")
            return result
        except Exception as e:
            self.logger.error(f"Error during PraisonAI Agents kickoff: {e}")
            raise
