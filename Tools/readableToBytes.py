# Converts an hexadecimal string (ie 684aff) in the corresponding string (ie replacing bytes by characters)
def readableToBytes(s):
    retBytes = ""
    for i in range(len(s)//2):
        retBytes += chr(int(s[2*i:2*(i+1)], 16))
    return retBytes


s = input()

print(readableToBytes(s))