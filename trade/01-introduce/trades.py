import ccxt
import json

from pytest import param
from env import OKEX_ACCOUNT
from datetime import datetime
import pandas as pd


# =====创建ccxt交易所
OKEX_CONFIG = {
    'apiKey': OKEX_ACCOUNT['apiKey'],
    'secret': OKEX_ACCOUNT['secret'],
    'password': OKEX_ACCOUNT['password'],
    'rateLimit': 10,
    'enableRateLimit': False}
exchange = ccxt.okex5(OKEX_CONFIG)

# for attr in dir(exchange):
#     print(attr)

# ===========获取订单薄信息 
# ticker = exchange.fetch_order_book(symbol='ETH-USDT')
# print(ticker)

# ===========获取产品行情信息
ticker = exchange.fetch_ticker(symbol='CRV-USDT')
print(ticker)
# print(json.dumps(ticker,sort_keys=True, indent=4, separators=(',', ': ')))
"""
"info": {
        "askPx": "2577.6",
        "askSz": "18.125826",
        "bidPx": "2577.59",
        "bidSz": "0.57",
        "high24h": "2649",
        "instId": "ETH-USDT",
        "instType": "SPOT",
        "last": "2576.7",
        "lastSz": "0.00103",
        "low24h": "2444.78",
        "open24h": "2533.66",
        "sodUtc0": "2491.41",
        "sodUtc8": "2617.77",
        "ts": "1646734664165",
        "vol24h": "127154.670966",
        "volCcy24h": "324687930.404882"
    }
"""

# =====获取账户余额
# balance = exchange.fetch_balance()
# print(json.dumps(balance,sort_keys=True, indent=4, separators=(',', ': ')))

# =====查看当前所有订单
# pendingOrder = exchange.private_get_trade_orders_pending()
# print(json.dumps(pendingOrder,sort_keys=True, indent=4, separators=(',', ': ')))

# =====查看持仓信息
# positions = exchange.fetch_position('CRV-USDT-SWAP')
# print(json.dumps(positions,sort_keys=True, indent=4, separators=(',', ': ')))

# =====现货限价买入
# spot_limit_order_info = exchange.create_limit_buy_order('CRV-USDT', 1, 1)  # 交易对、买卖数量、价格
# id = spot_limit_order_info["id"]
# clientOrderId = spot_limit_order_info["clientOrderId"]
# print(json.dumps(spot_limit_order_info,sort_keys=True, indent=4, separators=(',', ': ')))
"""
 "info": {
        "clOrdId": "e847386590ce4dBC1999db6a22d8e59d",
        "ordId": "421369648742047748",
        "sCode": "0",
        "sMsg": "",
        "tag": ""
    }
"""

# =====现货市价买入
# spot_market_order_info = exchange.create_market_buy_order('CRV-USDT',1)  # 交易对、买卖数量、价格
# print(json.dumps(spot_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))

# =====查看订单状态
# orderStauts = exchange.fetch_order(id=spot_market_order_info['id'],symbol='CRV-USDT')
# print(json.dumps(orderStauts,sort_keys=True, indent=4, separators=(',', ': ')))
"""
"info": {
        "accFillSz": "1",
        "avgPx": "2.0557",
        "cTime": "1646734190414",
        "category": "normal",
        "ccy": "",
        "clOrdId": "e847386590ce4dBC5d6855a968d190fa",
        "fee": "-0.0006",
        "feeCcy": "CRV",
        "fillPx": "2.0557",
        "fillSz": "1",
        "fillTime": "1646734190417",
        "instId": "CRV-USDT",
        "instType": "SPOT",
        "lever": "",
        "ordId": "421368967104733185",
        "ordType": "market",
        "pnl": "0",
        "posSide": "net",
        "px": "",
        "rebate": "0",
        "rebateCcy": "USDT",
        "side": "buy",
        "slOrdPx": "",
        "slTriggerPx": "",
        "slTriggerPxType": "",
        "source": "",
        "state": "filled",
        "sz": "1",
        "tag": "",
        "tdMode": "cash",
        "tgtCcy": "base_ccy",
        "tpOrdPx": "",
        "tpTriggerPx": "",
        "tpTriggerPxType": "",
        "tradeId": "28239268",
        "uTime": "1646734190419"
    },
"""

# =====现货限价卖出
# spot_market_order_info = exchange.create_limit_sell_order('CRV-USDT',1, 2.03)  # 交易对、买卖数量、价格
# print(json.dumps(spot_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))

# =====现货市价卖出
# spot_market_order_info = exchange.create_market_sell_order('CRV-USDT',1)  # 交易对、买卖数量、价格
# print(json.dumps(spot_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))

# =====取消现货订单 
# cancel_result = exchange.cancel_order(id,"BTC/USDT")
# if cancel_result["info"]["sCode"] == '0':
#     print("Cancel Order successfully")

# ===== U 本位永续合约限价买入
# swap_limit_order_info = exchange.create_order(symbol="CRV-USDT-SWAP",type="limit",side="buy",amount=1, price=1.2, params={
#     "tdMode":"isolated",
#     "posMode": "net_mode",
#     })

# ===== U 本位永续合约市价买入
# swap_market_order_info = exchange.create_order(symbol="CRV-USDT-SWAP",type="market",side="buy",amount=1, price=1.2, params={
#     "tdMode":"isolated",
#     "posMode": "net_mode",
#     "sz": 1
#     })
# print(json.dumps(swap_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))


# ===== U 本位永续合约市价卖出
# swap_market_order_info = exchange.create_order(symbol="CRV-USDT-SWAP",type="market",side="sell",amount=1, price=1.2, params={
#     "tdMode":"isolated",
#     "posMode": "net_mode"
#     })
# print(json.dumps(swap_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))


# ===== U 本位永续合约限价卖出
# swap_market_order_info = exchange.create_order(symbol="CRV-USDT-SWAP",type="limit",side="sell",amount=1, price=3.2, params={
#     "tdMode":"isolated",
#     "posMode": "net_mode"
#     })
# print(json.dumps(swap_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))


# ===== U 本位永续合约市价平仓
# swap_market_order_info = exchange.private_post_trade_close_position({"instId":"CRV-USDT-SWAP","mgnMode":"isolated"})
# print(json.dumps(swap_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))


# ===== U 本位永续合约取消订单
# swap_orderl_cancel_result = exchange.cancel_order("420568348559319041","CRV-USDT-SWAP")
# if swap_orderl_cancel_result["info"]["sCode"] == '0':
#     print("Cancel Order successfully")
# print(json.dumps(swap_orderl_cancel_result,sort_keys=True, indent=4, separators=(',', ': ')))

# ===== 币 本位永续合约市价买入
# swap_market_order_info = exchange.create_order(symbol="CRV-USD-SWAP",type="market",side="buy",amount=1, price=1.2, params={
#     "tdMode":"isolated",
#     "posMode": "net_mode",
#     "sz": 1
#     })
# print(json.dumps(swap_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))


# ===== 币 本位永续合约限价买入
# swap_limit_order_info = exchange.create_order(symbol="CRV-USD-SWAP",type="limit",side="buy",amount=1, price=1.2, params={
#     "tdMode":"isolated",
#     "posMode": "net_mode",
#     })
# print(json.dumps(swap_limit_order_info,sort_keys=True, indent=4, separators=(',', ': ')))


# ===== 币 本位永续合约市价平仓
# swap_market_order_info = exchange.private_post_trade_close_position({"instId":"CRV-USD-SWAP","posSide":"net","mgnMode":"isolated"})
# print(json.dumps(swap_market_order_info,sort_keys=True, indent=4, separators=(',', ': ')))


# ===== 币 本位永续合约取消订单
# swap_orderl_cancel_result = exchange.cancel_order("420997896992104460","CRV-USD-SWAP")
# if swap_orderl_cancel_result["info"]["sCode"] == '0':
#     print("Cancel Order successfully")
# print(json.dumps(swap_orderl_cancel_result,sort_keys=True, indent=4, separators=(',', ': ')))