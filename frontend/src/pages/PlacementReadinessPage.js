import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Target, Flame, Trophy, Code2, Database, Brain, Cpu, CheckCircle2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PlacementReadinessPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        const response = await axios.get(`${API}/readiness`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReadiness(response.data);
      } catch (error) {
        console.error('Failed to fetch readiness:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReadiness();
  }, [token]);

  if (loading || !readiness) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  const roleIcons = {
    'SDE': Code2,
    'Data Analyst': Database,
    'Data Scientist': Brain,
    'ML Engineer': Cpu
  };
  const RoleIcon = roleIcons[readiness.role] || Code2;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="readiness-page">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Badge className="bg-amber-100 text-amber-700">Placement Readiness</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Readiness</h1>
              <p className="text-slate-500">Track your interview preparation progress</p>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <Card className="border-slate-200 mb-6">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Overall Readiness for {readiness.role}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-slate-900">{readiness.overall_readiness}%</span>
                  <span className="text-slate-400">ready</span>
                </div>
              </div>
              <div className="w-32 h-32 rounded-full border-8 border-amber-100 flex items-center justify-center relative">
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#f59e0b ${readiness.overall_readiness}%, #f1f5f9 0%)`
                  }}
                />
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center z-10">
                  <RoleIcon className="w-10 h-10 text-amber-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Skill Score</p>
                  <p className="text-xl font-bold text-slate-900">{readiness.skill_score}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Consistency</p>
                  <p className="text-xl font-bold text-slate-900">{readiness.consistency_score}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Points</p>
                  <p className="text-xl font-bold text-slate-900">{readiness.points}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Current Streak</p>
                  <p className="text-xl font-bold text-slate-900">{readiness.streak?.current || 0} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Breakdown */}
        <Card className="border-slate-200 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Skill Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> DSA
                  </span>
                  <span className="font-medium">{readiness.breakdown?.dsa || 0} problems</span>
                </div>
                <Progress value={(readiness.breakdown?.dsa || 0) / 20 * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Analytics
                  </span>
                  <span className="font-medium">{readiness.breakdown?.analytics || 0} topics</span>
                </div>
                <Progress value={(readiness.breakdown?.analytics || 0) / 6 * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Data Science
                  </span>
                  <span className="font-medium">{readiness.breakdown?.datascience || 0} topics</span>
                </div>
                <Progress value={(readiness.breakdown?.datascience || 0) / 4 * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Machine Learning
                  </span>
                  <span className="font-medium">{readiness.breakdown?.ml || 0} topics</span>
                </div>
                <Progress value={(readiness.breakdown?.ml || 0) / 3 * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {readiness.recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
