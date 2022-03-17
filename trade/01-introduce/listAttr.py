import ccxt
from env import OKEX_ACCOUNT
import os

OKEX_CONFIG = {
    'apiKey': OKEX_ACCOUNT['apiKey'],
    'secret': OKEX_ACCOUNT['secret'],
    'password': OKEX_ACCOUNT['password'],
    'rateLimit': 10,
    'enableRateLimit': False}
exchange = ccxt.okex5(OKEX_CONFIG)

try:
    # open file
    fp = open("attr.txt","w")

    # write attr into target file
    for attr in dir(exchange):
        fp.write(attr)
        fp.write("\n")
finally:
    if fp:
        fp.close()

