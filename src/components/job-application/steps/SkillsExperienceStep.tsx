import { useState, useEffect } from 'react';
import { SkillsExperience } from '../types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface SkillsExperienceStepProps {
  data: SkillsExperience;
  updateData: (field: keyof SkillsExperience, value: Record<string, 'Good' | 'Basic' | 'None'>) => void;
}

interface SkillsCategory {
  id: string;
  name: string;
  description: string | null;
}

interface Skill {
  id: string;
  category_id: string | null;
  name: string;
}

interface SkillsByCategory {
  [categoryName: string]: Skill[];
}

export function SkillsExperienceStep({ data, updateData }: SkillsExperienceStepProps) {
  const [skillsByCategory, setSkillsByCategory] = useState<SkillsByCategory>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      
      // Fetch skills from unified settings
      const { data: skillsData, error } = await supabase
        .from('job_application_settings')
        .select('*')
        .eq('category', 'skills')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // Separate categories and skills
      const categories = skillsData?.filter(s => s.setting_type === 'category') || [];
      const skills = skillsData?.filter(s => s.setting_type === 'skill') || [];

      // Group skills by category
      const grouped: SkillsByCategory = {};
      
      categories.forEach(category => {
        const categoryName = typeof category.setting_value === 'object' && category.setting_value && 'name' in category.setting_value
          ? (category.setting_value as any).name
          : category.setting_key;
          
        const categorySkills = skills.filter(skill => 
          typeof skill.setting_value === 'object' && skill.setting_value && 'category_id' in skill.setting_value &&
          (skill.setting_value as any).category_id === category.id
        );
        
        if (categorySkills.length > 0) {
          grouped[categoryName] = categorySkills.map(skill => ({
            id: skill.id,
            name: typeof skill.setting_value === 'object' && skill.setting_value && 'name' in skill.setting_value
              ? (skill.setting_value as any).name
              : skill.setting_key,
            category_id: category.id
          }));
        }
      });

      setSkillsByCategory(grouped);
    } catch (error) {
      console.error('Error fetching skills:', error);
      // Set some fallback skills if the fetch fails
      setSkillsByCategory({
        'Personal Care': [
          { id: '1', name: 'Washing and Bathing', category_id: '1' },
          { id: '2', name: 'Feeding Assistance', category_id: '1' },
          { id: '3', name: 'Medication Administration', category_id: '1' }
        ],
        'Communication': [
          { id: '4', name: 'Active Listening', category_id: '2' },
          { id: '5', name: 'Verbal Communication', category_id: '2' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSkillChange = (skill: string, level: 'Good' | 'Basic' | 'None') => {
    updateData('skills', { ...data.skills, [skill]: level });
  };

  if (loading) {
    return <div>Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Skills & Experience</h3>
        <p className="text-muted-foreground mb-6">Please indicate if you have skills and experience in the following areas.</p>
      </div>

      <div className="space-y-6">
        {Object.entries(skillsByCategory).map(([categoryName, skills]) => (
          <Card key={categoryName} className="border">
            <CardHeader>
              <CardTitle className="text-base">{categoryName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map(skill => (
                <div key={skill.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Label className="font-medium text-sm flex-1">{skill.name}</Label>
                  <div className="flex gap-2">
                    {(['Good', 'Basic', 'None'] as const).map(level => (
                      <Button
                        key={level}
                        variant={data.skills?.[skill.name] === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSkillChange(skill.name, level)}
                        className="min-w-[60px]"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}