import security from 'eslint-plugin-security';

export default [
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module'
        },
        plugins: {
            security
        },
        rules: {
            ...security.configs.recommended.rules
        }
    }
];
