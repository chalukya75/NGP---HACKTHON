import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Briefcase } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const JobTrendsPopup = ({ onClose }) => {
  const { token } = useAuth();
  const [trends, setTrends] = useState([]);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await axios.get(`${API}/trends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrends(response.data.trends);
        setUserRole(response.data.user_role);
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      }
    };
    fetchTrends();
  }, [token]);

  if (trends.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40" data-testid="job-trends-popup" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Card className="w-full max-w-md mx-4 border-slate-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Job Market Insights</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            Trends relevant to your {userRole} journey
          </p>

          <div className="space-y-3">
            {trends.map((trend) => (
              <div key={trend.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-slate-900 text-sm">{trend.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{trend.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {trend.skills.slice(0, 4).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={onClose} className="w-full mt-4 bg-slate-900 hover:bg-slate-800">
            Got it, let's practice!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobTrendsPopup;
