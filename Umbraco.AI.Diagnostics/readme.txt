
░█████╗░██╗  ██████╗░██╗░█████╗░░██████╗░███╗░░██╗░█████╗░░██████╗████████╗██╗░█████╗░░██████╗
██╔══██╗██║  ██╔══██╗██║██╔══██╗██╔════╝░████╗░██║██╔══██╗██╔════╝╚══██╔══╝██║██╔══██╗██╔════╝
███████║██║  ██║░░██║██║███████║██║░░██╗░██╔██╗██║██║░░██║╚█████╗░░░░██║░░░██║██║░░╚═╝╚█████╗░
██╔══██║██║  ██║░░██║██║██╔══██║██║░░╚██╗██║╚████║██║░░██║░╚═══██╗░░░██║░░░██║██║░░██╗░╚═══██╗
██║░░██║██║  ██████╔╝██║██║░░██║╚██████╔╝██║░╚███║╚█████╔╝██████╔╝░░░██║░░░██║╚█████╔╝██████╔╝
╚═╝░░╚═╝╚═╝  ╚═════╝░╚═╝╚═╝░░╚═╝░╚═════╝░╚═╝░░╚══╝░╚════╝░╚═════╝░░░░╚═╝░░░╚═╝░╚════╝░╚═════╝░

  
TTTTTTTTTTTTTTTTTTTTTTThhhhhhh                                                kkkkkkkk                                                                                                    
T:::::::::::::::::::::Th:::::h                                                k::::::k                                                                                                    
T:::::::::::::::::::::Th:::::h                                                k::::::k                                                                                                    
T:::::TT:::::::TT:::::Th:::::h                                                k::::::k                                                                                                    
TTTTTT  T:::::T  TTTTTT h::::h hhhhh         aaaaaaaaaaaaa  nnnn  nnnnnnnn     k:::::k    kkkkkkk  ssssssssss        yyyyyyy           yyyyyyy ooooooooooo   uuuuuu    uuuuuu             
        T:::::T         h::::hh:::::hhh      a::::::::::::a n:::nn::::::::nn   k:::::k   k:::::k ss::::::::::s        y:::::y         y:::::yoo:::::::::::oo u::::u    u::::u             
        T:::::T         h::::::::::::::hh    aaaaaaaaa:::::an::::::::::::::nn  k:::::k  k:::::kss:::::::::::::s        y:::::y       y:::::yo:::::::::::::::ou::::u    u::::u             
        T:::::T         h:::::::hhh::::::h            a::::ann:::::::::::::::n k:::::k k:::::k s::::::ssss:::::s        y:::::y     y:::::y o:::::ooooo:::::ou::::u    u::::u             
        T:::::T         h::::::h   h::::::h    aaaaaaa:::::a  n:::::nnnn:::::n k::::::k:::::k   s:::::s  ssssss          y:::::y   y:::::y  o::::o     o::::ou::::u    u::::u             
        T:::::T         h:::::h     h:::::h  aa::::::::::::a  n::::n    n::::n k:::::::::::k      s::::::s                y:::::y y:::::y   o::::o     o::::ou::::u    u::::u             
        T:::::T         h:::::h     h:::::h a::::aaaa::::::a  n::::n    n::::n k:::::::::::k         s::::::s              y:::::y:::::y    o::::o     o::::ou::::u    u::::u             
        T:::::T         h:::::h     h:::::ha::::a    a:::::a  n::::n    n::::n k::::::k:::::k  ssssss   s:::::s             y:::::::::y     o::::o     o::::ou:::::uuuu:::::u             
      TT:::::::TT       h:::::h     h:::::ha::::a    a:::::a  n::::n    n::::nk::::::k k:::::k s:::::ssss::::::s             y:::::::y      o:::::ooooo:::::ou:::::::::::::::uu           
      T:::::::::T       h:::::h     h:::::ha:::::aaaa::::::a  n::::n    n::::nk::::::k  k:::::ks::::::::::::::s               y:::::y       o:::::::::::::::o u:::::::::::::::u           
      T:::::::::T       h:::::h     h:::::h a::::::::::aa:::a n::::n    n::::nk::::::k   k:::::ks:::::::::::ss               y:::::y         oo:::::::::::oo   uu::::::::uu:::u           
      TTTTTTTTTTT       hhhhhhh     hhhhhhh  aaaaaaaaaa  aaaa nnnnnn    nnnnnnkkkkkkkk    kkkkkkksssssssssss                y:::::y            ooooooooooo       uuuuuuuu  uuuu           
                                                                                                                           y:::::y                                                        
                                                                                                                          y:::::y                                                         
                                                                                                                         y:::::y                                                          
                                                                                                                        y:::::y                                                           
                                                                                                                       yyyyyyy                                                                                                                                                                                                                                                     

Umbraco AI Diagnostics analyzes application logs using AI to simplify complex issues by identifying possible root causes and providing actionable suggestions to fix them.

Quick Start with Configuration

  "AI": {
    "Diagnostics": {
      "LogLevels": [ "Error", "Critical", "Warning" ],
      "MaxBatchSize": 100,
      "EnableAI": true,
      "AIProvider": "Ollama",
      "PromptFilePath": "prompt/analysis-prompt.txt",
      "Ollama": {
        "Endpoint": "",
        "Model": ""
      },
      "Gemini": {
        "ApiKey": "",
        "Model": ""
      }
    }
  }