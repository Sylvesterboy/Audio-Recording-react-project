import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Microphone = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [pastRecords, setPastRecords] = useState([]); // Past recordings (audio + transcription)
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const audioBlobRef = useRef(null); // Reference to the current audio blob

  // Load past records from localStorage when component mounts
  useEffect(() => {
    const savedRecords = JSON.parse(localStorage.getItem('records')) || [];
    setPastRecords(savedRecords);
  }, []);

  // Save audio and transcription to localStorage
  const saveRecord = (audioBase64, transcript) => {
    const newRecord = { audio: audioBase64, transcript };
    const savedRecords = JSON.parse(localStorage.getItem('records')) || [];
    savedRecords.push(newRecord);
    localStorage.setItem('records', JSON.stringify(savedRecords));
    setPastRecords(savedRecords); // Update state to display immediately
  };

  // Function to start recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      audioChunks.current = [];
      audioBlobRef.current = audioBlob; // Store the blob for later use
      const audioBase64 = await convertBlobToBase64(audioBlob);
      transcribeAudio(audioBlob, audioBase64);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  // Function to stop recording
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  // Convert Blob to Base64 for storage in localStorage
  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Transcribe audio using Deepgram API
  const transcribeAudio = async (audioBlob, audioBase64) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await axios.post('https://api.deepgram.com/v1/listen', formData, {
        headers: {
          'Authorization': 'd98a7b861b5a64ba2e90f8eb3a01fd1bd985cd99',
        },
      });
      const transcript = response.data.transcript;
      setTranscription(transcript);
      // The audio blob is now stored in audioBlobRef
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  // Function to save current recording and transcription
  const handleSave = async () => {
    if (audioBlobRef.current && transcription) {
      const audioBase64 = await convertBlobToBase64(audioBlobRef.current);
      saveRecord(audioBase64, transcription); // Save audio + transcription
      setTranscription(''); // Clear the current transcription
      audioBlobRef.current = null; // Reset the audio blob reference
    } else {
      alert('Please record audio and wait for transcription before saving.');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Button to start/stop recording */}
      <button
        className={`p-2 rounded ${isRecording ? 'bg-red-500' : 'bg-green-500'} text-white`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      {/* Button to save the current transcription */}
      <button
        className="ml-2 p-2 rounded bg-blue-500 text-white"
        onClick={handleSave}
        disabled={!transcription} // Disable button if there's no transcription
      >
        Save Transcription
      </button>

      {/* Display current transcription if available */}
      {transcription && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Current Transcription:</h3>
          <p className="p-2 bg-gray-200 rounded">{transcription}</p>
        </div>
      )}

      {/* Display past recordings and transcriptions */}
      {pastRecords.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Past Recordings:</h3>
          <ul className="list-disc pl-4">
            {pastRecords.map((record, index) => (
              <li key={index} className="p-2 bg-gray-100 rounded mb-2">
                {/* Audio playback */}
                <audio controls src={record.audio} className="w-full"></audio>

                {/* Display transcription */}
                <p className="mt-2">Transcription: {record.transcript}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Microphone;
