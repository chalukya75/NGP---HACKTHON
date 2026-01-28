import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Database, FileSpreadsheet, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AnalyticsTrackPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get(`${API}/skills/analytics`, {
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

  const trackIcons = {
    'sql': Database,
    'excel': FileSpreadsheet,
    'eda': BarChart3
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="analytics-track-page">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Badge className="bg-emerald-100 text-emerald-700">Data Analytics</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Analytics Track</h1>
              <p className="text-slate-500">SQL, Excel, and EDA skills for analyst roles</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {tracks.map((track) => {
            const Icon = trackIcons[track.id] || Database;
            return (
              <Card key={track.id} className="border-slate-200 task-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        track.completed_tasks === track.total_tasks ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        {track.completed_tasks === track.total_tasks ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <Icon className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{track.name}</h3>
                        <p className="text-sm text-slate-500">{track.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{track.total_tasks} topics</Badge>
                          {track.completed_tasks > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-700">{track.completed_tasks} done</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Start
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-slate-200 mt-8 bg-emerald-50/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Why Data Analytics?</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• SQL is asked in 90% of data analyst interviews</li>
              <li>• Excel skills are essential for day-to-day analysis</li>
              <li>• EDA helps you understand any dataset quickly</li>
              <li>• Combined with Python, you become a powerful analyst</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
