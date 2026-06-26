import { useCurrentHome, useHomeTasks } from '@/api/hooks';
import { TaskCard } from '@/components/task-card';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';

export default function TasksScreen() {
  const homeQuery = useCurrentHome();
  const tasksQuery = useHomeTasks(homeQuery.data?.id);

  return (
    <QueryBoundary title="Tasks" query={tasksQuery} gates={[homeQuery]}>
      {(tasks) => (
        <Screen title="Tasks">
          {tasks.length === 0 ? (
            <EmptyView message="No tasks yet. Add tasks from a device." />
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </Screen>
      )}
    </QueryBoundary>
  );
}
