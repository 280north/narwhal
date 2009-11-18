
JA: normal JSON
    [[1,2,3],[4,5,6]]

JA': abnormal multi-line JSON
    [[1,2,3],
    [4,5,6]]

JAR: normal reversed java array
    [[3,2,1],[6,5,4]]

JOA: deep JSON config file
    {
        "values": [
            [1,2,3],
            [4,5,6]
        ]
    }

JAO: a deep JSON array of objects

    [
        {"a": 1, "b": 2, "c": 3},
        {"a": 4, "b": 5, "c": 6}
    ]

JAS: a JSON array of sums

    [6, 15]

JP: pretty JSON, t = 4

    [
        [1,2,3],
        [4,5,6]
    ]

JL: lines of JSON
    [1,2,3]
    [4,5,6]

J0: null-terminated lines of JSON

    [1,2,3]\0[4,5,6]\0

SL: lines of toString

    1,2,3
    4,5,6

S0: null terminated lines of toString

    1,2,3\04,5,6\0

flat lines of JSON values
    1
    2
    3
    4
    5
    6

flat lines of JSON
    "2"
    "3"
    "4"
    "5"
    "6"

UAA: unix records

    1:2:3
    4:5:6

Cookbook
========

JOA -> JA: extracting a JSON array form a JSON object with an array
-N}e{P

    -N  _.read() 
    -}  JSON.decode(_) 
    -e  statement(_)        "_.values"
    -{  JSON.encode(_) 
    -P  print(_)

JA -> JOA: creating a JSON object with an array from a JSON array
-N}x{P

    -N  _.read() 
    -}  JSON.decode(_) 
    -x  expression(_)       "{values: _}"
    -{  JSON.encode(_) 
    -P  print(_)

JAO -> JA: converting objects to arrays
-N}f{P

    -N  _.read()
    -}  JSON.decode(_)
    -f  _.map(select)       "a,b,c"
    -{  JSON.encode(_)
    -P  print(_)

JAR -> JA
-N}

    -N  _.read()
    -}  JSON.decode(_)
    -f  _.map(select)       "3,2,1"
    -{  JSON.encode(_)
    -P  print(_)

JA -> JAS: calculating the sum of each array
-N}l{P

    -N  _.read()
    -}  JSON.decode(_)
    -l  _.map(lambda)       "a,b,c" "a+b+c"
    -{  JSON.encode(_)
    -P  print(_)

JA' -> JA: normalizing an abnormal JSON file
-N}{P

    -N  _.read()
    -}  JSON.decode(_) 
    -{  JSON.encode(_) 
    -P  print(_)

JL -> J
-}]{P

    -}  _.map(JSON.decode) 
    -]  [array(_)] 
    -{  JSON.encode(_) 
    -P  print(_)

J -> JL
-N}{p

    -N  _.read()
    -}  JSON.decode(_) 
    -{  _.map(JSON.encode) 
    -p  _.forEach(print)

J -> SL
-N}p

    -N  _.read()
    -}  JSON.decode(_) 
    -p  _.forEach(print)

SL -> JA
-ne]{P

    -ne _.map(expression)   "_.split(/,/)"
    -]  [array(_)]
    -{  JSON.encode(_)
    -P  print(_)

UAA -> JA
-d]{P

    -d  _.map(split)    ":"
    -]  [array(_)]
    -{  JSON.encode(_)
    -P  print(_)

UAA -> JAR
-d]f{P

    -d  _.map(split)     ":"
    -]  [array(_)]
    -f  _.map(select)    "3,2,1"
    -{  JSON.encode(_)
    -P  print(_)

