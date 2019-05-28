/* eslint-disable no-console */
import React from "react";

export const MorePermission = () => {
  const onClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const activeTab = tabs[0];
      if (activeTab.url) {
        const origin = new URL(activeTab.url).origin + "/*";
        console.log(origin);
        chrome.permissions.request(
          {
            origins: [origin]
          },
          res => {
            console.log(res);
          }
        );
      }
    });
  };
  return <button onClick={onClick}>request permission</button>;
};

export const ShowPermissions = () => {
  const onClick = () => {
    chrome.permissions.getAll(perms => {
      console.log(perms);
    });
  };
  return <button onClick={onClick}>show permission</button>;
};
