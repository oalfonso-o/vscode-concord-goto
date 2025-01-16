1. solve vars
    what to do:
        - goto definitions
        - show hover message with the actual value
    cases:
        - ${components} -> defined in  "configuration"
            'ck8s-components/00-base/ck8s-00-base.concord.yaml::configuration.arguments.components
        - ${adipParams} -> defined in  "set in a flow"
            'ck8s-components/adip/ck8s-adip.concord.yaml::flows.adipPrereq.set.adipParams
        - ${workDir} -> it's the root of the project, can't find where it's defined
        - "${clusterRequest.helm.metricsServer.version}" -> defined in ck8s-config
            'ck8s-config/ck8s.yaml::helm.metricsServer.version'
        - ${clusterRequest.aetion.sparkOperator.staticCustomers} -> defined in ck8s-orgs
            'ck8s-orgs/aetion/accounts/dev/account.yaml::aetion.sparkOperator.staticCustomers'
            'ck8s-orgs/aetion/accounts/prod/infra-prod-g/cluster.yaml::aetion.sparkOperator.staticCustomers'

2. goto script path of "run: >-"

3. show hover with the docs of the flow, they are comments always over the flow definition

4. for html files, add "goto" flow for this line:
    <input id="flow" name="flow" value="aetionReleaseComponents" type="hidden"/>


for "solving vars" ->

find:
```
configuration:
  arguments:
```
get all arguments of this file
store them in a dict, for example for
```
configuration:
  arguments:
    key1: x
    key2:
        subkey2: y
```
will be {
    key1: location1
    key2: location2
    key2.subkey2: location3
}
then when solving ${} vars, check if it's ${key2} or ${key2.subkey2}, take the string directly to the dict

1. get current flow lines
```
foreach line in document:
    find "flows:" line, then start checking flows:
        store flow "{2 spaces}{string}{:}"
            store all lines... if find "current position" -> stop
            if find next FLOW, discard previous flow
```
2. convert flow lines to yml
3. extract variables from the flow:
    self-flow::"- set:" previous to word
4. extract variables from all flow paths that could bring us here, aka, flows that call this flow, for example:
    - we are in flowExample
    1. flowA calls flowB
    2. flowB calls flowExample
    - but also:
    1. flowX calls flowB
    2. flowsB we know calls flowExample
    - and maybe also:
    - 1. flowTest calls flowExample
    ... here we would have 3 possible paths where this variable could be defined, find in these 3 paths where the variable could be defined, if we find it, return the position where it's defined

5. extract self-document::configuration.arguments
6. ck8s-components/00-base/ck8s-00-base.concord.yaml::configuration.arguments
