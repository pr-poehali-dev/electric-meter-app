import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface UploadSectionProps {
  onNewReading: (reading: { meterNumber: string; reading: number; photo?: string }) => void;
}

const UploadSection = ({ onNewReading }: UploadSectionProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, загрузите изображение',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsProcessing(true);

    setTimeout(() => {
      const mockMeterNumber = `EM-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      const mockReading = Math.floor(10000 + Math.random() * 90000);

      onNewReading({
        meterNumber: mockMeterNumber,
        reading: mockReading,
        photo: reader.result as string,
      });

      setIsProcessing(false);
      setPreviewUrl(null);
      
      if (e.target) {
        e.target.value = '';
      }
    }, 2000);
  };

  return (
    <Card className="p-8 shadow-lg border-0 bg-white">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              <Icon name="Camera" size={24} className="text-primary" />
              Загрузка фото счётчика
            </h2>
            <p className="text-muted-foreground">
              ИИ автоматически распознает номер и показания счётчика
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Icon
                    name="Upload"
                    size={48}
                    className="text-primary mb-3"
                  />
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Нажмите для загрузки
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG (макс. 10МБ)
                  </p>
                </div>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </Label>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-lg animate-pulse">
                <Icon name="Loader2" size={20} className="animate-spin text-primary" />
                <span className="text-sm font-medium text-primary">
                  Распознавание показаний...
                </span>
              </div>
            )}
          </div>

          <div className="bg-cyan-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-cyan-900">
              <Icon name="Lightbulb" size={18} />
              Советы для точного распознавания
            </h3>
            <ul className="text-sm space-y-1 text-cyan-800">
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0" />
                Убедитесь, что цифры чёткие и хорошо видны
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0" />
                Снимайте при хорошем освещении
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0" />
                Держите камеру параллельно счётчику
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
          {previewUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground space-y-3">
              <Icon name="Image" size={64} className="mx-auto opacity-30" />
              <p className="text-sm">Предпросмотр фото</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UploadSection;
