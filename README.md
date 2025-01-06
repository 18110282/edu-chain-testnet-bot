# edu-chain-testnet-bot
Swap and Lend in edu-chain-testnet

## Installation
1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/18110282/edu-chain-testnet-bot.git
   ```
2. Navigate to the project directory:
   ```bash
   cd edu-chain-testnet-bot
   ```
3. Install the necessary dependencies:
   ```bash
   npm install
   ```
4. **Add PRIVATE_KEY and WALLET_ADDRESS in info-wallets.txt**  
   **=> Purpose: The TXT file will store a list of private keys and wallet addresses**  
   **Format: Each line must contain a PRIVATE_KEY and a WALLET_ADDRESS, separated by a hyphen (-)**  
   **Example:**
   ```bash
   PRIVATE_KEY1-WALLET_ADDRESS1
   PRIVATE_KEY2-WALLET_ADDRESS2
   PRIVATE_KEY3-WALLET_ADDRESS3
   ```
   **Vietsub:**    
      **Tệp TXT sẽ được sử dụng để lưu danh sách các ví và khóa riêng tư.**  
      **Mỗi dòng trong tệp chứa một cặp PRIVATE_KEY và WALLET_ADDRESS, cách nhau bởi dấu gạch ngang**
6. Run the script:
   ```bash
   node index.js
   ```
