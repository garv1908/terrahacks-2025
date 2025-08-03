import csv
import os
import json
from datetime import datetime
from typing import Dict, List, Optional

class CSVDatabase:
    def __init__(self, csv_file: str = 'recordings.csv'):
        self.csv_file = csv_file
        self.fieldnames = [
            'id', 'patient_name', 'doctor_name', 'date', 'duration',
            'transcription', 'doctor_notes', 'patient_summary', 'status'
        ]
        self._ensure_csv_exists()
    
    def _ensure_csv_exists(self):
        """Create CSV file with headers if it doesn't exist"""
        if not os.path.exists(self.csv_file):
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=self.fieldnames)
                writer.writeheader()
    
    def save_recording(self, recording_data: Dict) -> bool:
        """Save a recording to the CSV database"""
        try:
            # Prepare data for CSV storage
            csv_row = {
                'id': recording_data.get('id'),
                'patient_name': recording_data.get('patientName'),
                'doctor_name': recording_data.get('doctorName'),
                'date': recording_data.get('date', datetime.now().isoformat()),
                'duration': recording_data.get('duration', 0),
                'transcription': recording_data.get('transcription', ''),
                'doctor_notes': json.dumps(recording_data.get('doctorNotes', {})),
                'patient_summary': json.dumps(recording_data.get('patientSummary', {})),
                'status': recording_data.get('status', 'completed')
            }
            
            # Check if recording already exists (update instead of duplicate)
            existing_recordings = self.get_all_recordings()
            existing_ids = [r['id'] for r in existing_recordings]
            
            if csv_row['id'] in existing_ids:
                # Update existing record
                return self._update_recording(csv_row)
            else:
                # Add new record
                with open(self.csv_file, 'a', newline='', encoding='utf-8') as file:
                    writer = csv.DictWriter(file, fieldnames=self.fieldnames)
                    writer.writerow(csv_row)
                return True
                
        except Exception as e:
            print(f"Error saving recording: {e}")
            return False
    
    def _update_recording(self, updated_row: Dict) -> bool:
        """Update an existing recording"""
        try:
            recordings = self.get_all_recordings()
            
            # Update the matching record
            for i, recording in enumerate(recordings):
                if recording['id'] == updated_row['id']:
                    recordings[i] = updated_row
                    break
            
            # Rewrite the entire CSV file
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=self.fieldnames)
                writer.writeheader()
                writer.writerows(recordings)
            
            return True
        except Exception as e:
            print(f"Error updating recording: {e}")
            return False
    
    def get_recording(self, recording_id: str) -> Optional[Dict]:
        """Get a specific recording by ID"""
        try:
            with open(self.csv_file, 'r', newline='', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if row['id'] == recording_id:
                        # Parse JSON fields back to objects
                        row['doctor_notes'] = json.loads(row['doctor_notes']) if row['doctor_notes'] else {}
                        row['patient_summary'] = json.loads(row['patient_summary']) if row['patient_summary'] else {}
                        return row
            return None
        except Exception as e:
            print(f"Error getting recording: {e}")
            return None
    
    def get_all_recordings(self) -> List[Dict]:
        """Get all recordings from the database"""
        try:
            recordings = []
            with open(self.csv_file, 'r', newline='', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Parse JSON fields back to objects
                    row['doctor_notes'] = json.loads(row['doctor_notes']) if row['doctor_notes'] else {}
                    row['patient_summary'] = json.loads(row['patient_summary']) if row['patient_summary'] else {}
                    recordings.append(row)
            return recordings
        except Exception as e:
            print(f"Error getting all recordings: {e}")
            return []
    
    def delete_recording(self, recording_id: str) -> bool:
        """Delete a recording from the database"""
        try:
            recordings = self.get_all_recordings()
            recordings = [r for r in recordings if r['id'] != recording_id]
            
            # Rewrite the CSV file without the deleted record
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=self.fieldnames)
                writer.writeheader()
                for recording in recordings:
                    # Convert back to CSV format
                    csv_row = {
                        'id': recording['id'],
                        'patient_name': recording['patient_name'],
                        'doctor_name': recording['doctor_name'],
                        'date': recording['date'],
                        'duration': recording['duration'],
                        'transcription': recording['transcription'],
                        'doctor_notes': json.dumps(recording['doctor_notes']),
                        'patient_summary': json.dumps(recording['patient_summary']),
                        'status': recording['status']
                    }
                    writer.writerow(csv_row)
            
            return True
        except Exception as e:
            print(f"Error deleting recording: {e}")
            return False
