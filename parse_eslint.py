import json
import sys

def parse_eslint_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        errors = []
        for result in data:
            file_path = result.get('filePath', '')
            for message in result.get('messages', []):
                if message.get('severity') == 2: # Error
                    errors.append({
                        'file': file_path,
                        'line': message.get('line'),
                        'column': message.get('column'),
                        'message': message.get('message'),
                        'ruleId': message.get('ruleId')
                    })
        
        print(f"Total Errors Found: {len(errors)}")
        for error in errors:
            print(f"{error['file']}:{error['line']}:{error['column']} - {error['message']} ({error['ruleId']})")
            
    except Exception as e:
        print(f"Error parsing JSON: {e}")

if __name__ == "__main__":
    parse_eslint_json('eslint_current.json')
