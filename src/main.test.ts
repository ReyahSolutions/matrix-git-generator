import { getOutput, shouldAlwaysTrigger, getAllFilesFromGit } from './main';
import { expect } from '@jest/globals';

describe('Diff matching', () => {
  it('Should match for a single service', async () => {
    expect(getOutput(['service.*/**'], ['service.Foo/index.js'], 1)).toEqual([
      'service.Foo'
    ]);
  });
  it('Should match for a TWO serviceS', async () => {
    expect(
      getOutput(
        ['service.*/**'],
        ['service.Foo/index.js', 'service.Bar/index.js'],
        1
      )
    ).toEqual(['service.Foo', 'service.Bar']);
  });
  it('Should not match for a single service', async () => {
    expect(getOutput(['service.*/**'], ['otherFile'], 1)).toEqual([]);
  });
  it('Should work for depth greater than 1', async () => {
    expect(
      getOutput(['services/*/**'], ['services/service-a/index.js'], 2)
    ).toEqual(['services/service-a']);
    expect(
      getOutput(
        ['services/*/**'],
        ['services/service-a/index.js', 'services/service-b/index.js'],
        2
      )
    ).toEqual(['services/service-a', 'services/service-b']);
    expect(
      getOutput(['services/*/*/**'], ['services/group-1/service-a/index.js'], 3)
    ).toEqual(['services/group-1/service-a']);
  });
});

describe('Should always trigger', () => {
  it('Should trigger when file inside defined directory is modified', async () => {
    expect(shouldAlwaysTrigger(['ci/**'], ['ci/test.sh'])).toBeTruthy();
  });
});

describe('Get all files', () => {
  it('Should return all files until depth', async () => {
    expect(
      await getAllFilesFromGit('7ca75c6d8b6021473b8437712c27a18c78381658', 2)
    ).toEqual([
      '.gitignore',
      'README.md',
      'action.yml',
      'dist/index.js',
      'package.json',
      'src/git.ts',
      'src/main.ts',
      'tsconfig.json',
      'yarn.lock'
    ]);
  });
});
