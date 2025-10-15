import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Reading } from '@/pages/Index';

interface StatisticsChartProps {
  readings: Reading[];
}

const StatisticsChart = ({ readings }: StatisticsChartProps) => {
  if (readings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Icon name="BarChart3" size={48} className="mx-auto mb-3 opacity-30" />
        <p>Недостаточно данных для статистики</p>
      </div>
    );
  }

  const sortedReadings = [...readings].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const groupedByMeter = sortedReadings.reduce((acc, reading) => {
    if (!acc[reading.meterNumber]) {
      acc[reading.meterNumber] = [];
    }
    acc[reading.meterNumber].push(reading);
    return acc;
  }, {} as Record<string, Reading[]>);

  const stats = Object.entries(groupedByMeter).map(([meterNumber, meterReadings]) => {
    const first = meterReadings[0];
    const last = meterReadings[meterReadings.length - 1];
    const totalConsumption = last.reading - first.reading;
    const daysCount =
      (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const avgPerDay = daysCount > 0 ? totalConsumption / daysCount : 0;

    return {
      meterNumber,
      totalConsumption,
      avgPerDay,
      readingsCount: meterReadings.length,
      lastReading: last.reading,
    };
  });

  const maxConsumption = Math.max(...stats.map((s) => s.totalConsumption), 1);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="Zap" size={20} className="text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">Всего показаний</div>
          </div>
          <div className="text-3xl font-bold">{readings.length}</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Activity" size={20} className="text-accent" />
            </div>
            <div className="text-sm text-muted-foreground">Счётчиков</div>
          </div>
          <div className="text-3xl font-bold">{stats.length}</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" size={20} className="text-purple-600" />
            </div>
            <div className="text-sm text-muted-foreground">Общее потребление</div>
          </div>
          <div className="text-3xl font-bold">
            {stats.reduce((sum, s) => sum + s.totalConsumption, 0).toLocaleString('ru-RU')}
            <span className="text-sm font-normal text-muted-foreground ml-1">кВт·ч</span>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon name="BarChart3" size={20} className="text-primary" />
          Потребление по счётчикам
        </h3>

        {stats.map((stat) => (
          <Card key={stat.meterNumber} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-mono font-semibold text-lg">{stat.meterNumber}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.readingsCount} измерений
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {stat.totalConsumption.toLocaleString('ru-RU')}
                </div>
                <div className="text-xs text-muted-foreground">кВт·ч всего</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(stat.totalConsumption / maxConsumption) * 100}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="Activity" size={14} />
                  <span>
                    Среднее: {stat.avgPerDay.toFixed(1)} кВт·ч/день
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="Gauge" size={14} />
                  <span>
                    Текущее: {stat.lastReading.toLocaleString('ru-RU')} кВт·ч
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StatisticsChart;
