import JsonTool from '../src/components/jsonTool/JsonTool';
import TextTool from '../src/features/textTool/TextTool';

export default function App() {
  return (
    <>
      <TextTool />
      <hr style={{ opacity: 0.1, margin: '40px 0' }} />
      <JsonTool />
    </>
  );
}
