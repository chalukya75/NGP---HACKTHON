import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Building2, Sparkles, Save, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ResumeBuilderPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [templates, setTemplates] = useState({});
  const [selectedCompany, setSelectedCompany] = useState('google');
  const [resumeContent, setResumeContent] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    summary: '',
    experience: '',
    projects: '',
    skills: '',
    education: ''
  });
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResumes, setSavedResumes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, resumesRes] = await Promise.all([
          axios.get(`${API}/resume/templates`, { headers: { Authorization: `Bearer ${token}` }}),
          axios.get(`${API}/resume/list`, { headers: { Authorization: `Bearer ${token}` }})
        ]);
        setTemplates(templatesRes.data.templates);
        setSavedResumes(resumesRes.data.resumes || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [token]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await axios.post(`${API}/resume/analyze`, {
        company: selectedCompany,
        content: resumeContent,
        template: 'modern'
      }, { headers: { Authorization: `Bearer ${token}` }});
      setAnalysis(response.data.analysis);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.post(`${API}/resume/create`, {
        company: selectedCompany,
        content: resumeContent,
        template: 'modern'
      }, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Resume saved!');
      
      const resumesRes = await axios.get(`${API}/resume/list`, { headers: { Authorization: `Bearer ${token}` }});
      setSavedResumes(resumesRes.data.resumes || []);
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const template = templates[selectedCompany];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="resume-builder-page">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Badge className="bg-violet-100 text-violet-700">Resume Builder</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-violet-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume Builder</h1>
              <p className="text-slate-500">Create ATS-friendly, company-specific resumes</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Resume Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Selection */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Target Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(templates).map((key) => (
                      <SelectItem key={key} value={key}>{templates[key].name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {template && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-500 mb-2">Focus areas for {template.name}:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.focus.map((f, i) => (
                        <Badge key={i} variant="outline">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resume Form */}
            <Card className="border-slate-200">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input 
                      value={resumeContent.name} 
                      onChange={(e) => setResumeContent({...resumeContent, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      value={resumeContent.email} 
                      onChange={(e) => setResumeContent({...resumeContent, email: e.target.value})}
                      placeholder="john@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>LinkedIn</Label>
                    <Input 
                      value={resumeContent.linkedin} 
                      onChange={(e) => setResumeContent({...resumeContent, linkedin: e.target.value})}
                      placeholder="linkedin.com/in/johndoe"
                    />
                  </div>
                  <div>
                    <Label>GitHub</Label>
                    <Input 
                      value={resumeContent.github} 
                      onChange={(e) => setResumeContent({...resumeContent, github: e.target.value})}
                      placeholder="github.com/johndoe"
                    />
                  </div>
                </div>

                <div>
                  <Label>Professional Summary</Label>
                  <Textarea 
                    value={resumeContent.summary} 
                    onChange={(e) => setResumeContent({...resumeContent, summary: e.target.value})}
                    placeholder="2-3 sentences about your background and goals..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Experience</Label>
                  <Textarea 
                    value={resumeContent.experience} 
                    onChange={(e) => setResumeContent({...resumeContent, experience: e.target.value})}
                    placeholder="Company, Role, Duration, Key achievements..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Projects</Label>
                  <Textarea 
                    value={resumeContent.projects} 
                    onChange={(e) => setResumeContent({...resumeContent, projects: e.target.value})}
                    placeholder="Project name, tech stack, impact..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Skills</Label>
                  <Textarea 
                    value={resumeContent.skills} 
                    onChange={(e) => setResumeContent({...resumeContent, skills: e.target.value})}
                    placeholder="Python, JavaScript, SQL, React..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Education</Label>
                  <Textarea 
                    value={resumeContent.education} 
                    onChange={(e) => setResumeContent({...resumeContent, education: e.target.value})}
                    placeholder="Degree, University, Year, GPA..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-violet-600 hover:bg-violet-700">
                    {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Analyze with AI
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} variant="outline">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips & Analysis */}
          <div className="space-y-6">
            {/* Company Tips */}
            {template && (
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tips for {template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {template.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-violet-600">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis */}
            {analysis && (
              <Card className="border-slate-200 border-violet-200 bg-violet-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="whitespace-pre-wrap text-sm text-slate-700">{analysis}</div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Saved Resumes */}
            {savedResumes.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Saved Resumes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {savedResumes.map((resume) => (
                      <div key={resume.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{resume.company}</p>
                          <p className="text-xs text-slate-500">{new Date(resume.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline">{resume.template}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
