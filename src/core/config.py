"""
Configuration management for CowSalt Pro.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

class Config:
    """Global configuration management."""
    
    _instance: Optional['Config'] = None
    _config: Dict[str, Any] = {}
    
    @classmethod
    def get_instance(cls) -> 'Config':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @classmethod
    def load(cls, config_path: Optional[Path] = None) -> None:
        """Load configuration from file."""
        if config_path is None:
            config_path = Path(__file__).parent.parent.parent / 'config' / 'config.json'
            
        try:
            if config_path.exists():
                with open(config_path, 'r') as f:
                    cls._config = json.load(f)
            else:
                cls._config = cls._get_default_config()
                cls.save(config_path)
                
        except Exception as e:
            logging.error(f"Failed to load configuration: {e}")
            cls._config = cls._get_default_config()
    
    @classmethod
    def save(cls, config_path: Optional[Path] = None) -> None:
        """Save configuration to file."""
        if config_path is None:
            config_path = Path(__file__).parent.parent.parent / 'config' / 'config.json'
            
        try:
            config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(config_path, 'w') as f:
                json.dump(cls._config, f, indent=4)
                
        except Exception as e:
            logging.error(f"Failed to save configuration: {e}")
    
    @staticmethod
    def _get_default_config() -> Dict[str, Any]:
        """Get default configuration."""
        return {
            'database': {
                'type': 'sqlite',
                'path': 'data/cowsaltpro.db'
            },
            'logging': {
                'level': 'INFO',
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            },
            'ui': {
                'theme': 'light',
                'language': 'en',
                'font_size': 10
            },
            'business': {
                'company_name': 'CowSalt Pro',
                'currency': 'USD',
                'tax_rate': 0.16
            }
        }
    
    @classmethod
    def get(cls, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        try:
            keys = key.split('.')
            value = cls._config
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default
    
    @classmethod
    def set(cls, key: str, value: Any) -> None:
        """Set configuration value."""
        try:
            keys = key.split('.')
            config = cls._config
            for k in keys[:-1]:
                config = config.setdefault(k, {})
            config[keys[-1]] = value
        except Exception as e:
            logging.error(f"Failed to set configuration value: {e}")
    
    def __getattr__(self, name: str) -> Any:
        """Get configuration value as attribute."""
        return self.get(name) 