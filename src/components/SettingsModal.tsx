import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';

interface SettingsData {
  systemPrompt: string;
  webhookUrl: string;
  authToken: string;
  maxHistory: number;
  requestTimeout: number;
  theme: 'light' | 'dark' | 'auto';
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SettingsData;
  onSaveSettings: (settings: SettingsData) => void;
}

const defaultSystemPrompt = `You are a helpful, agentic AI financial advisor specializing in credit cards. Your goal is to ask clarifying questions to understand the user's spending habits, credit score, and goals (rewards, travel, cashback, building credit) and then provide a personalized, ranked list of recommendations. Always use Markdown for formatting (tables for comparisons, lists for features). Never ask for PII like phone numbers.`;

export const SettingsModal = ({ open, onOpenChange, settings, onSaveSettings }: SettingsModalProps) => {
  const [formData, setFormData] = useState<SettingsData>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);
  
  const handleSave = () => {
    onSaveSettings({
      ...formData,
      webhookUrl: formData.webhookUrl.trim(),
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setFormData({
      ...formData,
      systemPrompt: defaultSystemPrompt
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Reset to Default
              </Button>
            </div>
          </div>

          <Separator />

          {/* Webhook Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Webhook Configuration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">n8n Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                placeholder="https://primary-production-da3f.up.railway.app/webhook/gyanam.store"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authToken">Authorization Token (Optional)</Label>
              <Input
                id="authToken"
                type="password"
                value={formData.authToken}
                onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                placeholder="Bearer token for webhook authentication"
              />
            </div>
          </div>

          <Separator />

          {/* Chat Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Chat Configuration</h3>
            
            <div className="space-y-2">
              <Label>Max History Messages: {formData.maxHistory}</Label>
              <Slider
                value={[formData.maxHistory]}
                onValueChange={(value) => setFormData({ ...formData, maxHistory: value[0] })}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                Number of previous messages to include in AI context
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestTimeout">Request Timeout (ms)</Label>
              <Input
                id="requestTimeout"
                type="number"
                value={formData.requestTimeout}
                onChange={(e) => setFormData({ ...formData, requestTimeout: parseInt(e.target.value) || 30000 })}
                min={5000}
                max={120000}
                step={1000}
              />
              <div className="text-sm text-muted-foreground">
                Maximum time to wait for AI response (5-120 seconds)
              </div>
            </div>
          </div>

          <Separator />

          {/* Theme */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Theme</h3>
            <RadioGroup
              value={formData.theme}
              onValueChange={(value: 'light' | 'dark' | 'auto') => 
                setFormData({ ...formData, theme: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto">Auto (System)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
