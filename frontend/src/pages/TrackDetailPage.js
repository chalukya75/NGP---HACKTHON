import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Code2, BookOpen, Bug, CheckCircle2, ChevronRight, Lightbulb } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const difficultyColors = {
  'Easy': 'bg-emerald-100 text-emerald-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'Hard': 'bg-red-100 text-red-700'
};

const typeIcons = {
  'coding': Code2,
  'concept': BookOpen,
  'debugging': Bug
};

export default function TrackDetailPage() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const response = await axios.get(`${API}/skills/dsa/${trackId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrack(response.data);
      } catch (error) {
        console.error('Failed to fetch track:', error);
        navigate('/dsa');
      } finally {
        setLoading(false);
      }
    };
    fetchTrack();
  }, [trackId, token, navigate]);

  if (loading || !track) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  const progressPercent = Math.round((track.completed_tasks / track.total_tasks) * 100);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="track-detail-page">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dsa')} className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Tracks
            </Button>
            <Badge className="bg-blue-100 text-blue-700">{track.name}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{track.name}</h1>
          <p className="text-slate-500 mt-1">{track.description}</p>
          
          <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium text-slate-900">{track.completed_tasks}/{track.total_tasks} ({progressPercent}%)</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        <div className="space-y-3">
          {track.tasks.map((task) => {
            const TypeIcon = typeIcons[task.type] || Code2;
            return (
              <Card key={task.id} className={`border-slate-200 task-card ${task.completed ? 'bg-emerald-50/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        task.completed ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <TypeIcon className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {task.difficulty && (
                            <Badge className={difficultyColors[task.difficulty]}>{task.difficulty}</Badge>
                          )}
                          <span className="text-xs text-slate-400">+{task.points} pts</span>
                          {task.attempts > 0 && (
                            <span className="text-xs text-slate-400">• {task.attempts} attempts</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link to={`/task/${trackId}/${task.id}`}>
                      <Button 
                        variant={task.completed ? 'outline' : 'default'}
                        className={task.completed ? '' : 'bg-blue-600 hover:bg-blue-700'}
                      >
                        {task.completed ? 'Review' : 'Solve'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-slate-200 mt-8 bg-amber-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Interview Tips for {track.name}</h3>
                <ul className="text-sm text-slate-600 mt-2 space-y-1">
                  <li>• Understand the problem before coding - ask clarifying questions</li>
                  <li>• Start with brute force, then optimize</li>
                  <li>• Always discuss time and space complexity</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
