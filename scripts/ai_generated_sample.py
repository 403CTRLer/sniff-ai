"""
This module provides comprehensive data processing utilities for handling
various types of input data with robust error handling and validation.
"""

import json
import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime


class DataProcessor:
    """
    A comprehensive data processor that handles various data transformation tasks.
    
    This class provides methods for processing, validating, and transforming
    data structures with proper error handling and logging capabilities.
    """
    
    def __init__(self, config: Dict[str, Any]) -> None:
        """
        Initialize the DataProcessor with configuration parameters.
        
        Args:
            config: Configuration dictionary containing processing parameters
        """
        self.config = self.validate_config(config)
        self.logger = self.setup_logger()
        
    def validate_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate the configuration parameters.
        
        Args:
            config: Configuration dictionary to validate
            
        Returns:
            Validated configuration dictionary
            
        Raises:
            ValueError: If configuration is invalid
        """
        if not isinstance(config, dict):
            raise ValueError("Configuration must be a dictionary")
        
        if 'timeout' not in config:
            config['timeout'] = 30
            
        if 'max_retries' not in config:
            config['max_retries'] = 3
            
        return config
    
    def setup_logger(self) -> logging.Logger:
        """
        Set up logging configuration for the processor.
        
        Returns:
            Configured logger instance
        """
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.INFO)
        
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
    
    def process_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process a list of data dictionaries with comprehensive validation.
        
        Args:
            data: List of dictionaries to process
            
        Returns:
            List of processed dictionaries
            
        Raises:
            TypeError: If input data is not a list
            ValueError: If data contains invalid items
        """
        if not isinstance(data, list):
            raise TypeError("Input data must be a list")
        
        if len(data) == 0:
            return []
        
        processed_data = []
        
        for item in data:
            if not isinstance(item, dict):
                raise ValueError("All items must be dictionaries")
            
            processed_item = self.process_item(item)
            processed_data.append(processed_item)
        
        return processed_data
    
    def process_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single data item with validation and transformation.
        
        Args:
            item: Dictionary item to process
            
        Returns:
            Processed dictionary item
        """
        processed_item = {}
        
        for key, value in item.items():
            if value is not None:
                if isinstance(value, str):
                    processed_item[key] = self.process_string_value(value)
                elif isinstance(value, (int, float)):
                    processed_item[key] = self.process_numeric_value(value)
                elif isinstance(value, list):
                    processed_item[key] = self.process_list_value(value)
                else:
                    processed_item[key] = value
        
        processed_item['processed_at'] = datetime.now().isoformat()
        
        return processed_item
    
    def process_string_value(self, value: str) -> str:
        """
        Process string values with proper validation and cleaning.
        
        Args:
            value: String value to process
            
        Returns:
            Processed string value
        """
        if not isinstance(value, str):
            raise TypeError("Value must be a string")
        
        processed_value = value.strip()
        
        if len(processed_value) == 0:
            return ""
        
        return processed_value
    
    def process_numeric_value(self, value: Union[int, float]) -> Union[int, float]:
        """
        Process numeric values with validation and normalization.
        
        Args:
            value: Numeric value to process
            
        Returns:
            Processed numeric value
        """
        if not isinstance(value, (int, float)):
            raise TypeError("Value must be numeric")
        
        if value < 0:
            return 0
        
        return value
    
    def process_list_value(self, value: List[Any]) -> List[Any]:
        """
        Process list values with validation and filtering.
        
        Args:
            value: List value to process
            
        Returns:
            Processed list value
        """
        if not isinstance(value, list):
            raise TypeError("Value must be a list")
        
        if len(value) == 0:
            return []
        
        processed_list = []
        
        for item in value:
            if item is not None:
                processed_list.append(item)
        
        return processed_list


def main() -> None:
    """
    Main function to demonstrate the DataProcessor functionality.
    """
    config = {
        'timeout': 60,
        'max_retries': 5
    }
    
    processor = DataProcessor(config)
    
    sample_data = [
        {'name': 'John Doe', 'age': 30, 'items': [1, 2, 3]},
        {'name': 'Jane Smith', 'age': 25, 'items': [4, 5, 6]}
    ]
    
    try:
        result = processor.process_data(sample_data)
        print(json.dumps(result, indent=2))
    except Exception as error:
        print(f"Error processing data: {error}")


if __name__ == "__main__":
    main()
