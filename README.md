# Matrix Git generator
With this github actions you can generate a matrix to run multiple jobs from git changes

This github actions has been designed to be used in monorepo where you want to execute jobs for specific folder changes.

## Example

```yaml
name: A simple demonstration
on: push

jobs:
  generate_matrix:
    name: Find services
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.generate_matrix.outputs.matrix }}
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Generate matrix
        id: generate_matrix
        uses: ReyahSolutions/matrix-git-generator@v1

  test_service:
    name: Test service
    runs-on: ubuntu-latest
    needs: [generate_matrix]
    strategy:
      matrix: ${{fromJson(needs.generate_matrix.outputs.matrix)}}
      fail-fast: true 
    steps:
      # [...] Do what ever you want

```
