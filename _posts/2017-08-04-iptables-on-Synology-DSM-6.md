---
layout: post
slug: "2017-08-04-iptables-on-Synology-DSM-6"
title: Configure NAT/MASQUERADE on Synology DiskStation Manager 6
description: 
category: Linux
tags: Galaxy, Tips
---

Since [DSM 6](https://www.synology.com/en-us/dsm/6.1), there is no longer `/usr/syno/etc.defaults/rc.d/S01iptables.sh` as mentioned in [2013](https://forum.synology.com/enu/viewtopic.php?f=39&t=62014) and [2014](https://forum.synology.com/enu/viewtopic.php?f=3&t=70083). The later thread mentioned the message, `insmod: ERROR: could not insert module /lib/modules/nf_nat.ko: Unknown symbol in module`, but till [2017](https://forum.synology.com/enu/viewtopic.php?f=3&t=70083&start=30#p490276), no one solve this problem.

Searching `iptables` leads me to a solution in [2016](https://forum.synology.com/enu/viewtopic.php?t=116126) for `NAT/MASQUERADE` on `DSM 6`. This following is my modified version.

* Place the following script into `/usr/syno/etc/rc.sysv/Galaxy_NAT.sh` and adjust the first two variables:

````bash
#!/bin/bash
#
# Change this variable to match your private network.
PRIVATE_NETWORK="10.20.0.0/24"
#
# Change this variable to match your public interface - either eth0 or eth1
PUBLIC_INTERFACE="eth0"

# Set PATH to find iptables
PATH=/sbin:/bin:/usr/sbin:/usr/bin:/usr/syno/sbin:/usr/syno/bin

# Module list where KERNEL_MODULES_NAT are defined.
IPTABLES_MODULE_LIST="/usr/syno/etc/iptables_modules_list"
source "${IPTABLES_MODULE_LIST}"

# Tool to load kernel modules (modprobe does not work for me)
BIN_SYNOMODULETOOL="/usr/syno/bin/synomoduletool"

# My service name - let's make sure we don't conflict with synology
SERVICE="Galaxy_NAT"

# iptable binary
IPTABLES="iptables"

start() {
    # Log execution time
    date

    # Make sure packet forwarding is enabled.
    # 'sysctl -w net.ipv4.ip_forward=1' does not work for me
    echo 1 > /proc/sys/net/ipv4/ip_forward

    # Count the number of modules so that we can verify if the module
    # insertion was successful. We replace whitespaces with newlines
    # and count lines.
    MODULE_COUNT=$(
        echo "${KERNEL_MODULES_NAT}" |
            gawk '{ print gensub(/\s+/, "\n", "g") }' |
            wc -l
    )

    # Load the kernel modules necessary for NAT
    "${BIN_SYNOMODULETOOL}" --insmod "${SERVICE}" ${KERNEL_MODULES_NAT}
    RV=$?

    # $BIN_SYNOMODULETOOL returns the number of loaded modules as return value
    [[ "${RV}" == "${MODULE_COUNT}" ]] || {
            echo >&2 "Error: Modules were not loaded. The following command failed:"
            echo >&2 "${BIN_SYNOMODULETOOL}" --insmod "${SERVICE}" ${KERNEL_MODULES_NAT}
            exit 1
        }

    # Turn on NAT.
    "${IPTABLES}" -t nat -A POSTROUTING -s "${PRIVATE_NETWORK}" -j MASQUERADE -o "${PUBLIC_INTERFACE}"
    RV=$?
    [[ "${RV}" == "0" ]] || {
            echo >&2 "Error: MASQUERADE rules could not be added. The following command failed:"
            echo >&2 "${IPTABLES}" -t nat -A POSTROUTING -s "${PRIVATE_NETWORK}" -j MASQUERADE -o "${PUBLIC_INTERFACE}"
            exit 1
        }

    # Log current nat table
    iptables -L -v -t nat
}

case "$1" in
        start)
                start
                exit
                ;;
        *)
                # Help message.
                echo "Usage: $0 start"
                exit 1
                ;;
esac
````

* To enable NAT automatically after each boot place the following configuration file to `/etc/init/Galaxy_NAT.conf`

````bash
description "NAT with iptables"

author "Galaxy"

start on syno.network.ready

console log

script
	/usr/syno/etc/rc.sysv/Galaxy_NAT.sh start
end script

# vim:ft=upstart
````

------

And, for the old ones:

````bash
# Enable port forwarding, in case not enabled by default
echo 1 > /proc/sys/net/ipv4/ip_forward
# sysctl -w net.ipv4.ip_forward=1
# Load the required modules
/usr/syno/etc.defaults/rc.d/S01iptables.sh load_nat_mod forwarding_test
# sleep 60
/sbin/iptables -t nat -A POSTROUTING -o eth3 -j MASQUERADE
````

I find [dudu](https://forum.synology.com/enu/memberlist.php?mode=viewprofile&u=141636&sid=8d9b4fde14b1418739da14005137fa36)'s script did not provide `stop` command as previous scripts, I may add them later.
The [2014](https://forum.synology.com/enu/viewtopic.php?f=3&t=70083#p266982) script are dumped below:

````bash
# Script to enable port forwarding and IP Masquerading, to share
# the primary internet connection to the second port of DS1512+

action=$1
shift;

local INT_IFACE="eth1"
local IFCFG_FILE="/etc/sysconfig/network-scripts/ifcfg-${INT_IFACE}"
local DHCPD_CONF="/etc/dhcpd/dhcpd.conf"
local RULES_NAT="/etc/firewall_rules_nat.dump"

logerr() { # [logger args] [msgs...]
        local TAG="nat_router"
        [ ! -z $action ] && TAG="${TAG} (${action})"
        logger -p user.err -t "${TAG}" "$@"
}

# Guard to prevent execution if NAT is not supposed to be enabled
[ -e $IFCFG_FILE -a -e ${DHCPD_CONF} ] || { logerr "Missing config files"; exit 1; }

local IPADDR=`get_key_value ${IFCFG_FILE} IPADDR`
local NETMASK=`get_key_value ${IFCFG_FILE} NETMASK`
local IS_ROUTER=`grep option:router ${DHCPD_CONF} | grep -c ${IPADDR}`

[ ${IS_ROUTER} -eq 0 ] && { logerr "Routing mode not enabled on ${INT_IFACE}"; exit 1; }

# Calculate local network CIDR
local CIDR_PREFIX=`ipcalc -p ${IPADDR} ${NETMASK} | cut -d'=' -f2`
local CIDR_IP=`ipcalc -n ${IPADDR} ${NETMASK} | cut -d'=' -f2`
local CIDR="${CIDR_IP}/${CIDR_PREFIX}"

setup_nat() {
        # Enable port forwarding, in case not enabled by default
        echo 1 > /proc/sys/net/ipv4/ip_forward

        # Load the required modules
        /usr/syno/etc.defaults/rc.d/S01iptables.sh load_nat_mod forwarding_test
}

load_nat_rules() {
        if [ -e ${RULES_NAT} ]; then
                /sbin/iptables-restore -n < ${RULES_NAT} &> /dev/null
                if [ $? -eq 0 ]; then
                        logerr "NAT rules loaded successfully"
                else
                        logerr "Error loading NAT rules from: ${RULES_NAT}"
                        exit 1;
                fi
        else
                logerr "No NAT rules found"
        fi

        # Define the masquerading rule
        /sbin/iptables -t nat -D POSTROUTING -s ${CIDR} -j MASQUERADE &> /dev/null   # don't add twice
        /sbin/iptables -t nat -A POSTROUTING -s ${CIDR} -j MASQUERADE
}

save_nat_rules() {
        local TMP_RULES="/tmp/firewall_rules_nat.tmp"

        echo "# $(date)" > ${TMP_RULES}
        echo "*nat" >> ${TMP_RULES}

        /sbin/iptables-save -t nat | grep "\-j DNAT" | uniq >> ${TMP_RULES}

        echo "COMMIT" >> ${TMP_RULES}
        mv -f ${TMP_RULES} ${RULES_NAT}

        logerr "NAT rules saved to ${RULES_NAT}"
}

clear_nat_rules() {
        /sbin/iptables-save -t nat |grep "\-j DNAT" | sed 's/^-A /-D /g' | while read line; do
                if [ ! -z $line ]; then
                        /sbin/iptables -t nat $line &> /dev/null
                fi
        done

        /sbin/iptables -t nat -D POSTROUTING -s ${CIDR} -j MASQUERADE &> /dev/null
}

case "$action" in
        start)
                setup_nat
                load_nat_rules
                ;;
        stop)
                save_nat_rules
                clear_nat_rules
                ;;
        restart)
                save_nat_rules
                clear_nat_rules
                load_nat_rules
                ;;
        *)
                echo "Usage: $0 [start|stop|restart]"
                ;;
esac

exit 0
````

---

In fact I was using ssh tunnel before NAT is configured as:

* `vi /etc/ssh/sshd_config`: `#AllowTcpForwarding yes` -> `AllowTcpForwarding yes`.
* `sudo synoservicectl --restart sshd`
* `vi ~/.ssh/config`: add `ProxyCommand ssh -A USER@172.16.3.5 -W %h:%p` to `HostName 172.99.3.3`.

---

Port Forwarding done: `iptables -t nat -A PREROUTING -p tcp -i eth0 --dport 222 -j DNAT --to-destination 172.99.3.3:22`.
Since I have used `MASQUERADE`, `SNAT` can be skipped for `iptables -t nat -A POSTROUTING -p tcp -s 172.99.3.3 --sport 22 -j SNAT --to-source $wan_addr`.


For [details](https://unix.stackexchange.com/a/264540/38666) on `SNAT/MASQUERADE`:

Basically `SNAT` and `MASQUERADE` do the same source NAT thing in the nat table within the POSTROUTING chain.

Differences

- `MASQUERADE` does not require `--to-source` as it was made to work with dynamically assigned IPs

- `SNAT` works only with static IPs, that's why it has `--to-source`

- `MASQUERADE` has extra overhead and is slower than `SNAT` because each time `MASQUERADE` target gets hit by a packet, it has to check for the IP address to use.

**NOTE**: A typical use case for `MASQUERADE`: AWS EC2 instance in a VPC, it has a private IP within the VPC CIDR (e.g. 10.10.1.0/24) - 10.10.1.100 for example, it also has a public IP so as to communicate with the Internet (assume it is in a public subnet) thru which the private IP 1:1 NAT. The public IP may change after instance reboot (if it is NOT an EIP), `MASQUERADE` is a better option in this use case.

Important: It is still possible to use `MASQUERADE` target with static IP, just be aware of the extra overhead.

References

- [iptables Tutorial](https://www.frozentux.net/iptables-tutorial/iptables-tutorial.html#MASQUERADETARGET)

- [NAT Tutorial](http://www.karlrupp.net/en/computer/nat_tutorial)

- [New iptables Gotchas](https://terrywang.net/2016/02/02/new-iptables-gotchas.html)

- [Oskar wrote the excellent in-depth tutorial 10 years ago](https://www.frozentux.net/iptables-tutorial/iptables-tutorial.html)
