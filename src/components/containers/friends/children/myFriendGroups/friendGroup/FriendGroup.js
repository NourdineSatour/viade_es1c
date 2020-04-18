import React from "react";
import {useLDflexList} from "@solid/react";
import "./FriendGroup.css";

/** Displays a list of friends with a checkBox */
export default function FriendGroup({
                               src, offset = 0, limit = Infinity, filter = () => true,
                               container = items => <ul className="ul-format">{items}</ul>,
                               children = (item, index) => <li name="friendlist" key={index}>{`${item}`}
                               <input name="friendGroup" className="ck" type="checkbox"></input></li>,
                             }) {
  const items = useLDflexList(src)
    .filter(filter)
    .slice(offset, +offset + +limit)
    .map(children);
  return container ? container(items) : items;
}