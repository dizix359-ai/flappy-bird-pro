import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Volume2, VolumeX, Music, Music2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
}

interface SettingsDialogProps {
  settings: AudioSettings;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onUpdateSettings: (settings: Partial<AudioSettings>) => void;
}

export const SettingsDialog = ({
  settings,
  onToggleSound,
  onToggleMusic,
  onUpdateSettings,
}: SettingsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors border border-border/50"
        >
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-foreground flex items-center justify-center gap-2">
            <Settings className="w-5 h-5" />
            الإعدادات
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4" dir="rtl">
          {/* Sound Effects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="font-medium text-foreground">المؤثرات الصوتية</span>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={onToggleSound}
              />
            </div>
            
            {settings.soundEnabled && (
              <div className="flex items-center gap-3 pr-7">
                <span className="text-xs text-muted-foreground w-12">الصوت</span>
                <Slider
                  value={[settings.soundVolume * 100]}
                  onValueChange={([value]) => onUpdateSettings({ soundVolume: value / 100 })}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-8">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Music */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.musicEnabled ? (
                  <Music className="w-5 h-5 text-primary" />
                ) : (
                  <Music2 className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="font-medium text-foreground">الموسيقى</span>
              </div>
              <Switch
                checked={settings.musicEnabled}
                onCheckedChange={onToggleMusic}
              />
            </div>
            
            {settings.musicEnabled && (
              <div className="flex items-center gap-3 pr-7">
                <span className="text-xs text-muted-foreground w-12">الصوت</span>
                <Slider
                  value={[settings.musicVolume * 100]}
                  onValueChange={([value]) => onUpdateSettings({ musicVolume: value / 100 })}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-8">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground pt-2">
            يتم حفظ الإعدادات تلقائياً
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
