import { useCurrentHome, useHomeTasks } from '@/api/hooks';
import { TaskCard } from '@/components/task-card';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-views';

export default function TasksScreen() {
  const homeQuery = useCurrentHome();
  const home = homeQuery.data;
  const tasksQuery = useHomeTasks(home?.id);

  if (homeQuery.isLoading || tasksQuery.isLoading) {
    return (
      <Screen title="Tasks">
        <LoadingView />
      </Screen>
    );
  }

  const error = homeQuery.error ?? tasksQuery.error;
  if (error) {
    return (
      <Screen title="Tasks">
        <ErrorView error={error} />
      </Screen>
    );
  }

  const tasks = tasksQuery.data ?? [];

  return (
    <Screen title="Tasks">
      {tasks.length === 0 ? (
        <EmptyView message="No tasks yet. Add tasks from a device." />
      ) : (
        tasks.map((task) => <TaskCard key={task.id} task={task} />)
      )}
    </Screen>
  );
}
