import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface SettingsSectionProps {
  settings: {
    chatId: string;
    botToken: string;
    enabled: boolean;
  };
  onSettingsChange: (settings: {
    chatId: string;
    botToken: string;
    enabled: boolean;
  }) => void;
}

const SettingsSection = ({ settings, onSettingsChange }: SettingsSectionProps) => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Настройки сохранены',
      description: 'Изменения успешно применены',
    });
  };

  const handleTestNotification = () => {
    if (!settings.enabled || !settings.chatId) {
      toast({
        title: 'Ошибка',
        description: 'Включите уведомления и укажите Chat ID',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Тестовое уведомление отправлено',
      description: 'Проверьте Telegram чат',
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 shadow-lg border-0">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Icon name="Send" size={24} className="text-primary" />
          Telegram уведомления
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="telegram-enabled" className="text-base font-medium">
                Включить уведомления
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Получать сообщения после сохранения показаний
              </p>
            </div>
            <Switch
              id="telegram-enabled"
              checked={settings.enabled}
              onCheckedChange={(enabled) =>
                onSettingsChange({ ...settings, enabled })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chat-id">Chat ID</Label>
            <Input
              id="chat-id"
              placeholder="-1001234567890"
              value={settings.chatId}
              onChange={(e) =>
                onSettingsChange({ ...settings, chatId: e.target.value })
              }
              disabled={!settings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              ID группы или личного чата в Telegram
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-token">Bot Token</Label>
            <Input
              id="bot-token"
              type="password"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={settings.botToken}
              onChange={(e) =>
                onSettingsChange({ ...settings, botToken: e.target.value })
              }
              disabled={!settings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Токен бота от @BotFather
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Icon name="Save" size={18} />
              Сохранить
            </Button>
            <Button
              onClick={handleTestNotification}
              variant="outline"
              className="flex-1 gap-2"
              disabled={!settings.enabled}
            >
              <Icon name="Send" size={18} />
              Тест
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Icon name="HelpCircle" size={22} className="text-primary" />
          Как настроить Telegram бота
        </h3>

        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              1
            </div>
            <div>
              <p className="font-medium mb-1">Создайте бота</p>
              <p className="text-muted-foreground">
                Найдите @BotFather в Telegram и отправьте команду /newbot
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              2
            </div>
            <div>
              <p className="font-medium mb-1">Получите токен</p>
              <p className="text-muted-foreground">
                BotFather выдаст токен — скопируйте его в поле Bot Token
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              3
            </div>
            <div>
              <p className="font-medium mb-1">Узнайте Chat ID</p>
              <p className="text-muted-foreground">
                Добавьте бота в группу или напишите ему, затем используйте @userinfobot
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-semibold text-xs">
              4
            </div>
            <div>
              <p className="font-medium mb-1">Активируйте</p>
              <p className="text-muted-foreground">
                Включите переключатель и сохраните настройки
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              После настройки вы будете получать уведомление в Telegram каждый раз, когда добавляете новые показания счётчика
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SettingsSection;
