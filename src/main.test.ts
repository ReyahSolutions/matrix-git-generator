import { getOutput, shouldAlwaysTrigger, getAllFilesFromGit } from './main';
import { expect } from '@jest/globals';

describe('Diff matching', () => {
  it('Should match for a single service', async () => {
    expect(
      getOutput(['service.*/**'], [], ['service.Foo/index.js'], 1)
    ).toEqual(['service.Foo']);
  });
  it('Should match for a TWO serviceS', async () => {
    expect(
      getOutput(
        ['service.*/**'],
        [],
        ['service.Foo/index.js', 'service.Bar/index.js'],
        1
      )
    ).toEqual(['service.Foo', 'service.Bar']);
  });
  it('Should not match for a single service', async () => {
    expect(getOutput(['service.*/**'], [], ['otherFile'], 1)).toEqual([]);
  });
  it('Should work for depth greater than 1', async () => {
    expect(
      getOutput(['services/*/**'], [], ['services/service-a/index.js'], 2)
    ).toEqual(['services/service-a']);
    expect(
      getOutput(
        ['services/*/**'],
        [],
        ['services/service-a/index.js', 'services/service-b/index.js'],
        2
      )
    ).toEqual(['services/service-a', 'services/service-b']);
    expect(
      getOutput(
        ['services/*/*/**'],
        [],
        ['services/group-1/service-a/index.js'],
        3
      )
    ).toEqual(['services/group-1/service-a']);
    expect(
      getOutput(
        ['services/*/*/**'],
        [],
        ['services/group-1/service-a/.gitignore'],
        3
      )
    ).toEqual(['services/group-1/service-a']);
  });
  it('Should exclude certain files, based on the exclude parameter', async () => {
    expect(
      getOutput(
        ['services/*/**'],
        ['services/service-a/**'],
        ['services/service-a/index.js'],
        2
      )
    ).toEqual([]);
    expect(
      getOutput(
        ['services/*/**'],
        ['services/service-a/**'],
        ['services/service-a/index.js', 'services/service-b/index.js'],
        2
      )
    ).toEqual(['services/service-b']);
    expect(
      getOutput(
        ['restructure/services/*/**'],
        ['**/_terraform/**'],
        [
          'restructure/services/service-a/api/index.js',
          'restructure/services/_terraform/main.tf'
        ],
        4
      )
    ).toEqual(['restructure/services/service-a/api']);
    expect(
      getOutput(
        ['restructure/services/*/**'],
        ['**/_terraform/**'],
        ['restructure/services/service-b/_terraform/main.tf'],
        4
      )
    ).toEqual([]);
  });
});

describe('Should always trigger', () => {
  it('Should trigger when file inside defined directory is modified', async () => {
    expect(shouldAlwaysTrigger(['ci/**'], ['ci/test.sh'])).toBeTruthy();
    expect(
      shouldAlwaysTrigger(
        ['ci/**', '.github/workflows/**'],
        ['ci/skaffold.yml']
      )
    ).toBeTruthy();
  });
  
 
});

describe('Should always trigger with exclusions', () => {
  it('Should trigger when file inside defined directory is modified (exclusions)', async () => {
    expect(
      shouldAlwaysTrigger(
        ['ci/!(libraries)/**'],
        ['ci/libraries/app.js', 'ci/bumba/app.js']
      )
    ).toBeTruthy();
  });
  
  it('Should not trigger when file inside defined directory is modified (exclusions)', async () => {
    expect(
      shouldAlwaysTrigger(
        ['ci/!(libraries)/**'],
        ['ci/libraries/app.js']
      )
    ).toBeFalsy();
  });
  
 
});

describe('Get all files', () => {
  it('Should return all files until depth', async () => {
    expect(
      await getAllFilesFromGit('7ca75c6d8b6021473b8437712c27a18c78381658', 2)
    ).toEqual([
      '.gitignore',
      '.prettierrc',
      'README.md',
      'action.yml',
      'dist/index.js',
      'jest.config.js',
      'package.json',
      'src/git.ts',
      'src/main.test.ts',
      'src/main.ts',
      'tsconfig.json',
      'yarn.lock'
    ]);
  });
});
