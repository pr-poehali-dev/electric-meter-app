import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Reading } from '@/pages/Index';

interface ReadingsTableProps {
  readings: Reading[];
}

const ReadingsTable = ({ readings }: ReadingsTableProps) => {
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

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Дата и время</TableHead>
            <TableHead className="font-semibold">Номер счётчика</TableHead>
            <TableHead className="font-semibold text-right">Показания</TableHead>
            <TableHead className="font-semibold text-right">Изменение</TableHead>
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReadingsTable;
