import { Layout } from './components/layout/Layout';
import { WorkoutBuilder } from './components/workout-builder/WorkoutBuilder';
import { useAI } from './hooks/useAI';

function App() {
  const { isLoading, error, generate, clearError } = useAI();

  return (
    <Layout>
      <WorkoutBuilder
        onGenerate={generate}
        isLoading={isLoading}
        error={error}
        onClearError={clearError}
      />
    </Layout>
  );
}

export default App;
