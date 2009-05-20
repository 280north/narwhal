system.stdout.write(system.fs.read({
    path: require.fileName,
    mode: 'b'
}));
