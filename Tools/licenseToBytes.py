import base64

def pad(s,k):
    n = len(s)
    return (k-n) * '0' + s


# Converts a license (base64 encoded) to a hexadecimal string
def licenseToBytes(s):
    retStr = ""
    decoded = base64.b64decode(s)
    for b in decoded:
        retStr += pad(hex(b)[2:], 2)
    return retStr

s = input()

print(licenseToBytes(s))