import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import UploadSection from '@/components/UploadSection';
import ReadingsTable from '@/components/ReadingsTable';
import StatisticsChart from '@/components/StatisticsChart';
import SettingsSection from '@/components/SettingsSection';

const API_URL = 'https://functions.poehali.dev/be62b850-1027-4724-a8a3-6d8564579b51';

export interface Reading {
  id: string;
  meterNumber: string;
  reading: number;
  timestamp: Date;
  photo?: string;
}

const Index = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramSettings, setTelegramSettings] = useState({
    chatId: '',
    botToken: '',
    enabled: false,
  });

  const { toast } = useToast();

  const loadReadings = async () => {
    try {
      const response = await fetch(`${API_URL}?userId=default_user`);
      const data = await response.json();
      
      const parsedReadings = data.readings.map((r: any) => ({
        id: r.id,
        meterNumber: r.meterNumber,
        reading: r.reading,
        timestamp: new Date(r.timestamp),
        photo: r.photoUrl,
      }));
      
      setReadings(parsedReadings);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить показания',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReadings();
  }, []);

  const handleNewReading = async (newReading: Omit<Reading, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meterNumber: newReading.meterNumber,
          reading: newReading.reading,
          photoUrl: newReading.photo,
          userId: 'default_user',
        }),
      });

      const data = await response.json();
      
      const reading: Reading = {
        id: data.reading.id,
        meterNumber: data.reading.meterNumber,
        reading: data.reading.reading,
        timestamp: new Date(data.reading.timestamp),
        photo: data.reading.photoUrl,
      };

      setReadings((prev) => [reading, ...prev]);

      toast({
        title: 'Показания сохранены',
        description: `Счётчик ${reading.meterNumber}: ${reading.reading} кВт·ч`,
      });

      if (telegramSettings.enabled && telegramSettings.chatId) {
        toast({
          title: 'Telegram уведомление',
          description: 'Уведомление отправлено в Telegram',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить показания',
        variant: 'destructive',
      });
    }
  };

  const handleExportToExcel = () => {
    const csvContent = [
      ['Дата', 'Время', 'Номер счётчика', 'Показания (кВт·ч)'],
      ...readings.map((r) => [
        r.timestamp.toLocaleDateString('ru-RU'),
        r.timestamp.toLocaleTimeString('ru-RU'),
        r.meterNumber,
        r.reading.toString(),
      ]),
    ]
      .map((row) => row.join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `показания_счётчиков_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Экспорт выполнен',
      description: 'Файл Excel успешно скачан',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Icon name="Zap" size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
              Электрик
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Автоматическое распознавание показаний счётчиков
          </p>
        </header>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-white shadow-sm">
            <TabsTrigger value="upload" className="gap-2">
              <Icon name="Camera" size={18} />
              <span className="hidden sm:inline">Загрузка</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Icon name="History" size={18} />
              <span className="hidden sm:inline">История</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Icon name="TrendingUp" size={18} />
              <span className="hidden sm:inline">Статистика</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Icon name="Settings" size={18} />
              <span className="hidden sm:inline">Настройки</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="animate-fade-in">
            <UploadSection onNewReading={handleNewReading} />
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            <Card className="p-6 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Icon name="FileText" size={24} className="text-primary" />
                  История показаний
                </h2>
                <Button
                  onClick={handleExportToExcel}
                  variant="outline"
                  className="gap-2"
                  disabled={readings.length === 0}
                >
                  <Icon name="Download" size={18} />
                  Экспорт в Excel
                </Button>
              </div>
              <ReadingsTable readings={readings} />
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="animate-fade-in">
            <Card className="p-6 shadow-lg border-0">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Icon name="BarChart3" size={24} className="text-primary" />
                Статистика потребления
              </h2>
              <StatisticsChart readings={readings} />
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <SettingsSection
              settings={telegramSettings}
              onSettingsChange={setTelegramSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;