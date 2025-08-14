import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SpeechRecorderProps {
  onTranscription: (text: string) => void;
}

const SpeechRecorder = ({ onTranscription }: SpeechRecorderProps) => {
  console.log("SpeechRecorder component mounted"); // Debug log
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processAudio();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak now. Click stop when finished.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const base64Audio = base64Data.split(',')[1]; // Remove data:audio/webm;base64, prefix
        
        try {
          const { data, error } = await supabase.functions.invoke('speech-to-text', {
            body: { audio: base64Audio }
          });
          
          if (error) {
            throw error;
          }
          
          if (data?.text) {
            onTranscription(data.text);
            toast({
              title: "Speech transcribed",
              description: "Text has been added to your message.",
            });
          } else {
            throw new Error('No transcription received');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: "Transcription failed",
            description: "Could not convert speech to text. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error('Audio processing error:', error);
      toast({
        title: "Audio processing failed",
        description: "Could not process the recorded audio.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      className="rounded-full shadow-sm"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isRecording ? (
        <Square className="w-4 h-4 mr-2" />
      ) : (
        <Mic className="w-4 h-4 mr-2" />
      )}
      {isProcessing ? "Processing..." : isRecording ? "Stop" : "Record"}
    </Button>
  );
};

export default SpeechRecorder;