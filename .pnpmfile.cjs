// openapi-typescript prints its output with the TypeScript 5 JS API. TypeScript 7 does not
// have that API. This hook gives openapi-typescript its own copy of TypeScript 5, so the
// project can compile with TypeScript 7. Remove the hook when openapi-typescript supports 7.
function readPackage(pkg) {
  if (pkg.name === "openapi-typescript") {
    delete pkg.peerDependencies.typescript;
    pkg.dependencies.typescript = "^5.9.3";
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
