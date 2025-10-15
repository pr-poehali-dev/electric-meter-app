import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const OCR_API_URL = 'https://functions.poehali.dev/c4430878-801d-4956-89f4-3b7d77a37ce7';

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
    
    reader.onload = async () => {
      const imageBase64 = reader.result as string;
      setPreviewUrl(imageBase64);
      setIsProcessing(true);

      try {
        const response = await fetch(OCR_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageBase64,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          if (errorData.error === 'OPENAI_API_KEY not configured') {
            toast({
              title: 'API ключ не настроен',
              description: 'Добавьте OPENAI_API_KEY в настройки проекта',
              variant: 'destructive',
            });
          } else {
            throw new Error(errorData.error || 'OCR failed');
          }
          
          setIsProcessing(false);
          setPreviewUrl(null);
          if (e.target) {
            e.target.value = '';
          }
          return;
        }

        const data = await response.json();

        onNewReading({
          meterNumber: data.meterNumber,
          reading: data.reading,
          photo: imageBase64,
        });

        toast({
          title: 'Распознавание успешно',
          description: `Счётчик: ${data.meterNumber}, Показания: ${data.reading} кВт·ч`,
        });

        setIsProcessing(false);
        setPreviewUrl(null);
        
        if (e.target) {
          e.target.value = '';
        }
      } catch (error) {
        toast({
          title: 'Ошибка распознавания',
          description: error instanceof Error ? error.message : 'Не удалось распознать показания',
          variant: 'destructive',
        });
        
        setIsProcessing(false);
        setPreviewUrl(null);
        
        if (e.target) {
          e.target.value = '';
        }
      }
    };

    reader.readAsDataURL(file);
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
              ИИ автоматически распознает номер из QR-кода и показания счётчика
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
                  AI распознаёт показания...
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
                Убедитесь, что цифры счётчика чёткие и хорошо видны
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0" />
                QR-код или наклейка с номером должны быть в кадре
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
              <p className="text-xs">Загрузите фото счётчика с QR-кодом</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UploadSection;
