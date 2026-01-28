import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Play, Send, Lightbulb, CheckCircle2, MessageSquare, Code2, BookOpen, Eye, Loader2, Mic, MicOff } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const difficultyColors = {
  'Easy': 'bg-emerald-100 text-emerald-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'Hard': 'bg-red-100 text-red-700'
};

export default function TaskPage() {
  const { trackId, taskId } = useParams();
  const navigate = useNavigate();
  const { token, refreshProfile } = useAuth();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await axios.get(`${API}/skills/dsa/${trackId}/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTask(response.data);
        setCode(response.data.starter_code || '');
        
        setChatMessages([{
          role: 'bro',
          content: `Hey! Working on "${response.data.title}"? Nice choice! 👊\n\nTake your time to understand the problem. If stuck, I'm here with hints - not answers. What have you figured out?`
        }]);
      } catch (error) {
        toast.error('Failed to load task');
        navigate(`/dsa/${trackId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId, trackId, token, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('');
    try {
      const response = await axios.post(`${API}/code/run`, 
        { code, task_id: taskId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setOutput(response.data.output || response.data.error || 'No output');
    } catch (error) {
      setOutput('Error running code.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/tasks/${taskId}/submit`,
        { task_id: taskId, code },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update streak
      await axios.post(`${API}/users/streak`, 
        { activity_type: 'dsa' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.points_earned > 0) {
        toast.success(`🎉 +${response.data.points_earned} points!`);
        await refreshProfile();
      } else {
        toast.success('Submission recorded!');
      }
      setTask(prev => ({ ...prev, completed: true }));
    } catch (error) {
      toast.error('Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await axios.post(`${API}/bro/chat`,
        { message: userMessage, context: `Task: ${task?.title}` },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setChatMessages(prev => [...prev, { role: 'bro', content: response.data.response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'bro', content: "Connection issues. Try again!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info('Recording... Click again to stop');
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    setIsChatLoading(true);
    setChatMessages(prev => [...prev, { role: 'user', content: '🎤 Voice message...' }]);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('context', `Task: ${task?.title}`);

      const response = await axios.post(`${API}/bro/voice`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'user', content: response.data.transcription };
        return [...updated, { role: 'bro', content: response.data.response }];
      });
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'bro', content: "Voice processing failed. Try text!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const showNextHint = () => {
    if (task?.hints && currentHint < task.hints.length) {
      toast.info(`Hint ${currentHint + 1}: ${task.hints[currentHint]}`);
      setCurrentHint(prev => prev + 1);
    } else {
      toast.info("No more hints. Ask BRO!");
    }
  };

  if (loading || !task) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="task-page">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/dsa/${trackId}`)} className="text-slate-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="font-semibold text-slate-900">{task.title}</h1>
              {task.difficulty && <Badge className={difficultyColors[task.difficulty]}>{task.difficulty}</Badge>}
              {task.completed && <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Done</Badge>}
            </div>
            <Badge variant="outline">+{task.points} pts</Badge>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Problem Pane */}
        <div className="w-1/4 min-w-[300px] border-r border-slate-200 bg-white overflow-hidden flex flex-col">
          <Tabs defaultValue="description" className="flex flex-col h-full">
            <TabsList className="w-full justify-start rounded-none border-b border-slate-200 bg-slate-50 px-4">
              <TabsTrigger value="description"><BookOpen className="w-4 h-4 mr-1" />Problem</TabsTrigger>
              <TabsTrigger value="solution"><Code2 className="w-4 h-4 mr-1" />Solution</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="flex-1 overflow-auto m-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">{task.description}</div>
                  {task.hints?.length > 0 && (
                    <Button variant="outline" size="sm" onClick={showNextHint} className="mt-6 text-amber-600 border-amber-200">
                      <Lightbulb className="w-4 h-4 mr-2" />Hint ({currentHint}/{task.hints.length})
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="solution" className="flex-1 overflow-auto m-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {showSolution ? (
                    <div className="whitespace-pre-wrap text-slate-700 text-xs font-mono bg-slate-50 p-4 rounded-lg">
                      {task.solution_explanation}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500 mb-4">Try solving first!</p>
                      <Button variant="outline" onClick={() => setShowSolution(true)}>
                        <Eye className="w-4 h-4 mr-2" />Show Solution
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col bg-slate-900 min-w-[400px]">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
            <span className="text-sm text-slate-400 font-mono">solution.py</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white" onClick={handleRunCode} disabled={isRunning}>
                {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Run
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Submit
              </Button>
            </div>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none outline-none leading-6"
            spellCheck="false"
          />
          
          <div className="h-1/4 min-h-[100px] border-t border-slate-700 bg-slate-800">
            <div className="px-4 py-2 border-b border-slate-700">
              <span className="text-sm text-slate-400">Output</span>
            </div>
            <ScrollArea className="h-[calc(100%-36px)]">
              <pre className="p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap">
                {output || 'Run code to see output...'}
              </pre>
            </ScrollArea>
          </div>
        </div>

        {/* BRO Chat */}
        <div className="w-1/4 min-w-[280px] border-l border-slate-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">BRO</h3>
              <p className="text-xs text-slate-500">Voice + Text</p>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`bro-message ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`max-w-[90%] rounded-lg px-3 py-2 ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="bro-message">
                  <div className="bg-slate-100 rounded-lg px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          
          <form onSubmit={handleChat} className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <Button 
                type="button" 
                size="icon" 
                variant={isRecording ? "destructive" : "outline"}
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? "animate-pulse" : ""}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask BRO..."
                className="flex-1"
                disabled={isChatLoading}
              />
              <Button type="submit" size="icon" disabled={isChatLoading || !chatInput.trim()} className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
