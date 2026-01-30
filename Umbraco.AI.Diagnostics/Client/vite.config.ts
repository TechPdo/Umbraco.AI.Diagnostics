import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: {
                'tree': 'src/tree.ts',
                'workspace': 'src/workspace.ts',
                'workspace-view': 'src/workspace-view.ts',
                'instructions-view': 'src/instructions-view.ts',
                'repository': 'src/repository.ts'
            },
            formats: ['es']
        },
        outDir: '../wwwroot/App_Plugins/UmbracoAIDiagnostics',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            external: [/^@umbraco/]
        }
    }
});
