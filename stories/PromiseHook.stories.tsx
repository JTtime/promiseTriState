import { usePromiseState } from '../src';
import { useState } from 'react';

export default {
  title: 'Hooks/usePromiseState',
};

export function BasicExample() {
  const [result, setResult] = useState('');

  const { execute, status } = usePromiseState<string>();

  const run = async () => {
    await execute(async () => {
      await new Promise((r) => setTimeout(r, 1000));
      setResult('guess');
      return 'done';
    });
  };

  return (
    <div>
      <button onClick={run}>
        Execute
      </button>

      <p>Status: {status}</p>

      <p>{result}</p>
    </div>
  );
}