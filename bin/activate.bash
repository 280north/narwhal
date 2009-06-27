
if [ -z "$PACKAGE_HOME" ]; then
    PACKAGE_HOME=$(pwd)
fi

# which -s narwhal doesn't work (os x 10.5, kriskowal)
if [ -f "$PACKAGE_HOME"/bin/narwhal ]; then
    NARWHAL="$PACKAGE_HOME"/bin/narwhal
elif [ -f "$PACKAGE_HOME"/packages/narwhal/bin/narwhal ]; then
    NARWHAL="$PACKAGE_HOME"/packages/narwhal/bin/narwhal
else
    env narwhal -e '' >/dev/null 2>&1
    if [ "$?" -ne 127 ]; then
        NARWHAL=narwhal
    else
        echo "ERROR: narwhal is not in your PATH or $PACKAGE_HOME/bin."
        exit
    fi
fi

if [ -f "$PACKAGE_HOME"/narwhal.conf ]; then
    source "$PACKAGE_HOME"/narwhal.conf
    export NARWHAL_DEFAULT_PLATFORM
fi

export PATH="$("$NARWHAL" --package "$PACKAGE_HOME" --path :)"

