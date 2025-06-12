import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ActivityMetrics from "@/components/activity/ActivityMetrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { supabase } from "@/infrastructure/database/client";

const ActivityMetricsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const [projectName, setProjectName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch project name if projectId is available
    if (projectId) {
      const fetchProjectName = async () => {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single();
          
          if (error) {
            console.error('Error fetching project:', error);
            return;
          }
          
          if (data) {
            setProjectName(data.name);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      };
      
      fetchProjectName();
    }
  }, [projectId]);

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center">
              <BarChart2 className="h-6 w-6 mr-2 text-primary" />
              <CardTitle>
                Activity Metrics {projectName ? `- ${projectName}` : ''}
              </CardTitle>
            </div>
            <CardDescription>
              Visual analytics and metrics for {projectId ? 'project' : 'system-wide'} activities
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/activity")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Activity Monitor
          </Button>
        </CardHeader>
      </Card>
      
      <ActivityMetrics 
        projectId={projectId} 
        className="w-full"
      />
    </div>
  );
};

export default ActivityMetricsPage; 