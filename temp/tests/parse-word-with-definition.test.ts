import { parseWordWithDefinition, parseWordsWithDefinitions } from '../parse-word-with-definition';

describe('parseWordWithDefinition', () => {
  it('should parse word with = separator', () => {
    const result = parseWordWithDefinition('hello = hi');
    expect(result.word).toBe('hello');
    expect(result.customDefinition).toBe('hi');
  });

  it('should parse word with - separator', () => {
    const result = parseWordWithDefinition('world - thế giới');
    expect(result.word).toBe('world');
    expect(result.customDefinition).toBe('thế giới');
  });

  it('should parse word with : separator', () => {
    const result = parseWordWithDefinition('cat : con mèo');
    expect(result.word).toBe('cat');
    expect(result.customDefinition).toBe('con mèo');
  });

  it('should parse word with | separator', () => {
    const result = parseWordWithDefinition('dog | con chó');
    expect(result.word).toBe('dog');
    expect(result.customDefinition).toBe('con chó');
  });

  it('should handle word without definition', () => {
    const result = parseWordWithDefinition('hello');
    expect(result.word).toBe('hello');
    expect(result.customDefinition).toBeUndefined();
  });

  it('should handle extra whitespace', () => {
    const result = parseWordWithDefinition('  hello   =   hi  ');
    expect(result.word).toBe('hello');
    expect(result.customDefinition).toBe('hi');
  });

  it('should return word only if definition is empty', () => {
    const result = parseWordWithDefinition('hello = ');
    expect(result.word).toBe('hello =');
    expect(result.customDefinition).toBeUndefined();
  });
});

describe('parseWordsWithDefinitions', () => {
  it('should parse multiple words with definitions', () => {
    const input = `hello = hi
world - thế giới
cat : con mèo`;
    
    const result = parseWordsWithDefinitions(input);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ word: 'hello', customDefinition: 'hi' });
    expect(result[1]).toEqual({ word: 'world', customDefinition: 'thế giới' });
    expect(result[2]).toEqual({ word: 'cat', customDefinition: 'con mèo' });
  });

  it('should filter out empty lines', () => {
    const input = `hello = hi

world - thế giới
`;
    
    const result = parseWordsWithDefinitions(input);
    
    expect(result).toHaveLength(2);
  });
});
