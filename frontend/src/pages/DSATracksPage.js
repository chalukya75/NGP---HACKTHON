import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Code2, ChevronRight, CheckCircle2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DSATracksPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get(`${API}/skills/dsa`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTracks(response.data.tracks);
      } catch (error) {
        console.error('Failed to fetch tracks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [token]);

  const totalCompleted = tracks.reduce((sum, t) => sum + t.completed_tasks, 0);
  const totalTasks = tracks.reduce((sum, t) => sum + t.total_tasks, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading tracks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dsa-tracks-page">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Badge className="bg-blue-100 text-blue-700">DSA Track</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Structures & Algorithms</h1>
              <p className="text-slate-500">Master DSA for coding interviews</p>
            </div>
          </div>
          
          <div className="mt-6 bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Overall Progress</span>
              <span className="font-medium text-slate-900">{totalCompleted} of {totalTasks} completed</span>
            </div>
            <Progress value={(totalCompleted / totalTasks) * 100} className="h-2" />
          </div>
        </div>

        <div className="space-y-4">
          {tracks.map((track, idx) => (
            <Card key={track.id} className="border-slate-200 task-card" data-testid={`track-card-${track.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      track.completed_tasks === track.total_tasks ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
                      {track.completed_tasks === track.total_tasks ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <span className="text-lg font-bold text-slate-500">{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{track.name}</h3>
                      <p className="text-sm text-slate-500">{track.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {track.total_tasks} problems
                        </Badge>
                        {track.completed_tasks > 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                            {track.completed_tasks} done
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link to={`/dsa/${track.id}`}>
                    <Button 
                      variant={track.completed_tasks > 0 ? "outline" : "default"}
                      className={track.completed_tasks > 0 ? "" : "bg-blue-600 hover:bg-blue-700"}
                    >
                      {track.completed_tasks > 0 ? 'Continue' : 'Start'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="mt-4">
                  <Progress value={(track.completed_tasks / track.total_tasks) * 100} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
