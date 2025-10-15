import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import type { Reading } from '@/pages/Index';

interface ReadingsTableProps {
  readings: Reading[];
  onUpdateReading: (id: string, newReading: number, newMeterNumber: string) => Promise<void>;
  onDeleteReading: (id: string) => Promise<void>;
}

const ReadingsTable = ({ readings, onUpdateReading, onDeleteReading }: ReadingsTableProps) => {
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [editedValue, setEditedValue] = useState('');
  const [editedMeterNumber, setEditedMeterNumber] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  if (readings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-30" />
        <p>Показания отсутствуют</p>
        <p className="text-sm mt-1">Загрузите фото счётчика для начала работы</p>
      </div>
    );
  }

  const sortedReadings = [...readings].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const handleEditClick = (reading: Reading) => {
    setEditingReading(reading);
    setEditedValue(reading.reading.toString());
    setEditedMeterNumber(reading.meterNumber);
  };

  const handleSaveEdit = async () => {
    if (!editingReading) return;

    const newReading = parseInt(editedValue, 10);
    if (isNaN(newReading) || newReading < 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректное значение показаний',
        variant: 'destructive',
      });
      return;
    }

    if (!editedMeterNumber.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Номер счётчика не может быть пустым',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onUpdateReading(editingReading.id, newReading, editedMeterNumber.trim());
      setEditingReading(null);
      toast({
        title: 'Успешно',
        description: 'Показания обновлены',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить показания',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (reading: Reading) => {
    if (!confirm(`Удалить запись счётчика ${reading.meterNumber}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteReading(reading.id);
      toast({
        title: 'Успешно',
        description: 'Запись удалена',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запись',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Дата и время</TableHead>
              <TableHead className="font-semibold">Номер счётчика</TableHead>
              <TableHead className="font-semibold text-right">Показания</TableHead>
              <TableHead className="font-semibold text-right">Изменение</TableHead>
              <TableHead className="font-semibold text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReadings.map((reading, index) => {
              const prevReading = sortedReadings[index + 1];
              const difference =
                prevReading && reading.meterNumber === prevReading.meterNumber
                  ? reading.reading - prevReading.reading
                  : null;

              return (
                <TableRow key={reading.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={16} className="text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {reading.timestamp.toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reading.timestamp.toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {reading.meterNumber}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-lg">
                      {reading.reading.toLocaleString('ru-RU')}
                    </span>
                    <span className="text-muted-foreground ml-1">кВт·ч</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {difference !== null ? (
                      <Badge
                        variant={difference > 0 ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        <Icon
                          name={difference > 0 ? 'TrendingUp' : 'Minus'}
                          size={14}
                        />
                        {difference > 0 ? '+' : ''}
                        {difference.toLocaleString('ru-RU')}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(reading)}
                        className="h-8 w-8 p-0"
                      >
                        <Icon name="Pencil" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reading)}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingReading} onOpenChange={() => setEditingReading(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать показания</DialogTitle>
            <DialogDescription>
              Измените показания или номер счётчика
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meter-number">Номер счётчика</Label>
              <Input
                id="meter-number"
                value={editedMeterNumber}
                onChange={(e) => setEditedMeterNumber(e.target.value)}
                placeholder="EM-2024-001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reading-value">Показания (кВт·ч)</Label>
              <Input
                id="reading-value"
                type="number"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReading(null)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReadingsTable;
